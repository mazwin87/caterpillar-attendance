-- Schema groundwork for moving login from plaintext app_users.password to real
-- Supabase Auth. app_users becomes a username/email directory pointing at
-- auth.users; user_branch_roles (already kindergarten-scoped) stays the source
-- of truth for role/branch access.
--
-- Also closes RLS gaps that would otherwise break the app the moment a real
-- authenticated session is used instead of the anon key: app_users, events and
-- payments currently only have anon-role policies, nothing for `authenticated`.

-- 1. Auth-linking columns on app_users
ALTER TABLE public.app_users ADD COLUMN email character varying(255);
ALTER TABLE public.app_users ADD COLUMN auth_user_id uuid;
ALTER TABLE public.app_users ADD COLUMN kindergarten_id uuid;

UPDATE public.app_users u
SET kindergarten_id = b.kindergarten_id
FROM public.branches b
WHERE u.branch_id = b.id AND u.kindergarten_id IS NULL;

-- rows with no branch_id (superadmin) backfill to the sole existing tenant
UPDATE public.app_users
SET kindergarten_id = (SELECT id FROM public.kindergartens WHERE slug = 'caterpillar')
WHERE kindergarten_id IS NULL;

ALTER TABLE public.app_users ALTER COLUMN kindergarten_id SET NOT NULL;
ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_kindergarten_id_fkey FOREIGN KEY (kindergarten_id)
    REFERENCES public.kindergartens(id) ON DELETE CASCADE;
ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_auth_user_id_fkey FOREIGN KEY (auth_user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_email_key UNIQUE (email);
ALTER TABLE public.app_users ADD CONSTRAINT app_users_auth_user_id_key UNIQUE (auth_user_id);

CREATE INDEX idx_app_users_kindergarten ON public.app_users USING btree (kindergarten_id);

-- 2. authenticated-role read policy for app_users (previously anon-only — an
-- authenticated user querying their own profile/username directory would see
-- zero rows with no policy at all for their role)
CREATE POLICY authenticated_read_app_users ON public.app_users FOR SELECT TO authenticated
    USING (
      auth_user_id = auth.uid()
      OR (
        kindergarten_id = public.get_my_kindergarten_id()
        AND (
          public.is_super_admin()
          OR EXISTS (
            SELECT 1 FROM public.user_branch_roles r
            WHERE r.user_id = auth.uid() AND r.role = 'branch_admin' AND r.branch_id = app_users.branch_id
          )
        )
      )
    );

-- 3. Self-service password-change flag clear (regular authenticated users can't
-- otherwise update their own app_users row — no broad UPDATE policy exists by
-- design, to avoid letting a user edit arbitrary columns of their own profile)
CREATE FUNCTION public.clear_my_must_change_password() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
  UPDATE public.app_users SET must_change_password = false WHERE auth_user_id = auth.uid();
$$;

-- 4. events and payments had no policy at all for authenticated/PUBLIC roles —
-- only `TO anon`. Add branch-scoped access so a real logged-in session keeps
-- working, matching the pattern already used for attendance/classes/etc.
CREATE POLICY branch_events ON public.events
    USING (EXISTS (
        SELECT 1 FROM public.branches b
        WHERE b.name = ANY (events.branches) AND b.id = ANY (public.get_my_branch_ids())
    ));

CREATE POLICY branch_payments ON public.payments
    USING (branch_id = ANY (public.get_my_branch_ids()));
