-- Multi-tenant foundation: kindergartens (tenant root), kindergarten_id propagation,
-- platform_admins (you, the operator), and tenant-scoping fixes to the dormant
-- get_my_branch_ids()/is_super_admin() RLS helpers.
--
-- Scope note: this migration does NOT touch the anon_* bypass policies. Those stay
-- in place until the Supabase Auth login migration lands, since the app currently
-- has no other way to read/write data.

-- 1. Tenant root table
CREATE TABLE public.kindergartens (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name character varying(150) NOT NULL,
    slug character varying(50) NOT NULL UNIQUE,
    subscription_status character varying(20) NOT NULL DEFAULT 'trial'
        CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
    trial_ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.kindergartens ENABLE ROW LEVEL SECURITY;
-- No client-facing policies: reads/writes go through service-role edge functions only.

-- 2. Platform operator accounts (you) — separate from any kindergarten's own roles
CREATE TABLE public.platform_admins (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
-- No client-facing policies: checked only via SECURITY DEFINER functions / service role.

CREATE FUNCTION public.is_platform_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
$$;

-- 3. Seed the existing production business as the first tenant, active (not trial)
INSERT INTO public.kindergartens (name, slug, subscription_status)
VALUES ('Caterpillar', 'caterpillar', 'active');

-- 4. Propagate kindergarten_id onto branches
ALTER TABLE public.branches ADD COLUMN kindergarten_id uuid;

UPDATE public.branches
SET kindergarten_id = (SELECT id FROM public.kindergartens WHERE slug = 'caterpillar')
WHERE kindergarten_id IS NULL;

ALTER TABLE public.branches ALTER COLUMN kindergarten_id SET NOT NULL;
ALTER TABLE public.branches
    ADD CONSTRAINT branches_kindergarten_id_fkey FOREIGN KEY (kindergarten_id)
    REFERENCES public.kindergartens(id) ON DELETE CASCADE;

CREATE INDEX idx_branches_kindergarten ON public.branches USING btree (kindergarten_id);

-- branch slugs only need to be unique within a kindergarten, not globally
ALTER TABLE public.branches DROP CONSTRAINT branches_slug_key;
ALTER TABLE public.branches ADD CONSTRAINT branches_kindergarten_id_slug_key UNIQUE (kindergarten_id, slug);

-- 5. Propagate kindergarten_id onto user_branch_roles
ALTER TABLE public.user_branch_roles ADD COLUMN kindergarten_id uuid;

UPDATE public.user_branch_roles r
SET kindergarten_id = b.kindergarten_id
FROM public.branches b
WHERE r.branch_id = b.id AND r.kindergarten_id IS NULL;

-- super_admin rows have no branch_id (global-within-tenant) — backfill to the sole
-- existing tenant since that's the only one that can exist before this migration runs
UPDATE public.user_branch_roles
SET kindergarten_id = (SELECT id FROM public.kindergartens WHERE slug = 'caterpillar')
WHERE kindergarten_id IS NULL;

ALTER TABLE public.user_branch_roles ALTER COLUMN kindergarten_id SET NOT NULL;
ALTER TABLE public.user_branch_roles
    ADD CONSTRAINT user_branch_roles_kindergarten_id_fkey FOREIGN KEY (kindergarten_id)
    REFERENCES public.kindergartens(id) ON DELETE CASCADE;

CREATE INDEX idx_user_branch_roles_kindergarten ON public.user_branch_roles USING btree (kindergarten_id);

-- 6. Tenant-scoping fix: get_my_branch_ids() now expands to a caller's full kindergarten
-- branch set when they hold a super_admin role, instead of relying on a separate global
-- is_super_admin() bypass in every policy (which had no kindergarten awareness at all —
-- a super_admin of one kindergarten could see every other kindergarten's rows).
CREATE OR REPLACE FUNCTION public.get_my_branch_ids() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(
    SELECT b.id
    FROM public.branches b
    WHERE b.kindergarten_id IN (
      SELECT kindergarten_id FROM public.user_branch_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    UNION
    SELECT branch_id FROM public.user_branch_roles
    WHERE user_id = auth.uid() AND branch_id IS NOT NULL
  );
$$;

CREATE FUNCTION public.get_my_kindergarten_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT kindergarten_id FROM public.user_branch_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 7. Drop the unscoped is_super_admin() bypass from every tenant-data policy — replaced
-- by the now tenant-aware get_my_branch_ids(). is_super_admin() itself is kept (still
-- useful as a plain role check) but must never be used alone as an RLS bypass again.
DROP POLICY branch_attendance ON public.attendance;
CREATE POLICY branch_attendance ON public.attendance
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY branch_classes ON public.classes;
CREATE POLICY branch_classes ON public.classes
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY branch_holidays ON public.holidays;
CREATE POLICY branch_holidays ON public.holidays
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY branch_notifications ON public.notifications;
CREATE POLICY branch_notifications ON public.notifications
    USING (EXISTS (
        SELECT 1 FROM public.attendance a
        WHERE a.id = notifications.attendance_id
          AND a.branch_id = ANY (public.get_my_branch_ids())
    ));

DROP POLICY branch_parents ON public.parents;
CREATE POLICY branch_parents ON public.parents
    USING (EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = parents.student_id
          AND s.branch_id = ANY (public.get_my_branch_ids())
    ));

DROP POLICY branch_students ON public.students;
CREATE POLICY branch_students ON public.students
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY manage_calendar ON public.school_calendar;
CREATE POLICY manage_calendar ON public.school_calendar
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY read_calendar ON public.school_calendar;
CREATE POLICY read_calendar ON public.school_calendar
    USING (branch_id = ANY (public.get_my_branch_ids()));

DROP POLICY read_own_branches ON public.branches;
CREATE POLICY read_own_branches ON public.branches
    USING (id = ANY (public.get_my_branch_ids()));

DROP POLICY own_roles ON public.user_branch_roles;
CREATE POLICY own_roles ON public.user_branch_roles
    FOR SELECT USING (
      user_id = auth.uid()
      OR (
        kindergarten_id = public.get_my_kindergarten_id()
        AND EXISTS (
          SELECT 1 FROM public.user_branch_roles r2
          WHERE r2.user_id = auth.uid() AND r2.role = 'super_admin'
        )
      )
    );
