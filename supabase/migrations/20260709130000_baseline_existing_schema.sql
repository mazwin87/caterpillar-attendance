-- Baseline: captures the schema as it existed in production (rykxrnhwvvlwlxdzjyub)
-- before any multi-tenant work began. Recorded from a schema-only pg_dump on 2026-07-09.
-- This file documents existing state; it is not meant to be re-applied to production
-- (already applied there historically via dashboard SQL editor, unversioned until now).

CREATE TYPE public.attendance_status AS ENUM (
    'PRESENT',
    'LATE',
    'ABSENT',
    'HOLIDAY'
);

CREATE FUNCTION public.generate_receipt_no(p_branch_id uuid) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_slug VARCHAR;
  v_count INT;
  v_year INT;
BEGIN
  SELECT slug INTO v_slug FROM branches WHERE id = p_branch_id;
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  SELECT COUNT(*) + 10501 INTO v_count FROM payments
  WHERE branch_id = p_branch_id
  AND EXTRACT(YEAR FROM created_at) = v_year;
  RETURN v_slug || '-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;

CREATE FUNCTION public.get_my_branch_ids() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(
    SELECT branch_id
    FROM user_branch_roles
    WHERE user_id = auth.uid()
  );
$$;

CREATE FUNCTION public.insert_holiday_attendance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  d DATE;
BEGIN
  d := NEW.start_date;
  WHILE d <= NEW.end_date LOOP
    INSERT INTO attendance (branch_id, student_id, date, status)
    SELECT branch_id, NEW.student_id, d, 'HOLIDAY'
    FROM students WHERE id = NEW.student_id
    ON CONFLICT (student_id, date) DO UPDATE SET status = 'HOLIDAY';
    d := d + INTERVAL '1 day';
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_branch_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

CREATE FUNCTION public.record_scan(p_student_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_student     students%ROWTYPE;
  v_status      attendance_status;
  v_hour        INTEGER;
  v_existing    attendance%ROWTYPE;
  v_result      JSON;
BEGIN
  SELECT * INTO v_student FROM students WHERE id = p_student_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  SELECT * INTO v_existing FROM attendance
  WHERE student_id = p_student_id AND date = CURRENT_DATE;
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Already recorded today',
      'status', v_existing.status,
      'student_name', v_student.name
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM holidays
    WHERE student_id = p_student_id
    AND CURRENT_DATE BETWEEN start_date AND end_date
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Student is on approved holiday');
  END IF;

  v_hour := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur'));
  IF v_hour < 9 THEN
    v_status := 'PRESENT';
  ELSIF v_hour < 10 THEN
    v_status := 'LATE';
  ELSE
    v_status := 'LATE';
  END IF;

  INSERT INTO attendance (branch_id, student_id, date, status, scanned_at, scanned_by)
  VALUES (v_student.branch_id, p_student_id, CURRENT_DATE, v_status, NOW(), auth.uid());

  RETURN json_build_object(
    'success', true,
    'student_name', v_student.name,
    'status', v_status,
    'scanned_at', NOW()
  );
END;
$$;

CREATE FUNCTION public.reset_user_password(p_user_id uuid, p_new_password text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE app_users
  SET password = p_new_password, must_change_password = true
  WHERE id = p_user_id;
END;
$$;

CREATE FUNCTION public.reset_user_password(p_user_id uuid, p_new_password text, p_must_change boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE app_users
  SET password = p_new_password, must_change_password = p_must_change
  WHERE id = p_user_id;
END;
$$;

CREATE FUNCTION public.run_daily_absent_marking() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  today DATE := (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  INSERT INTO attendance (student_id, branch_id, date, status)
  SELECT s.id, s.branch_id, today, 'ABSENT'
  FROM students s
  WHERE s.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.student_id = s.id
        AND a.date = today
    );
END;
$$;

CREATE TABLE public.app_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    branch_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    must_change_password boolean DEFAULT false NOT NULL,
    CONSTRAINT app_users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'teacher'::character varying, 'superadmin'::character varying])::text[])))
);

CREATE TABLE public.attendance (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    student_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status public.attendance_status NOT NULL,
    scanned_at timestamp with time zone,
    scanned_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    absence_reason character varying(50)
);

CREATE TABLE public.branches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    teacher_telegram_chat_id bigint,
    email character varying(100),
    website character varying(100),
    reg_no character varying(50)
);

CREATE TABLE public.classes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    teacher_id uuid,
    teacher_contact character varying(20),
    created_at timestamp with time zone DEFAULT now()
);

CREATE VIEW public.daily_branch_summary AS
 SELECT b.name AS branch,
    a.date,
    count(*) AS total,
    count(*) FILTER (WHERE (a.status = 'PRESENT'::public.attendance_status)) AS present,
    count(*) FILTER (WHERE (a.status = 'LATE'::public.attendance_status)) AS late,
    count(*) FILTER (WHERE (a.status = 'ABSENT'::public.attendance_status)) AS absent,
    count(*) FILTER (WHERE (a.status = 'HOLIDAY'::public.attendance_status)) AS holiday,
    round((((count(*) FILTER (WHERE (a.status = ANY (ARRAY['PRESENT'::public.attendance_status, 'LATE'::public.attendance_status]))))::numeric * 100.0) / (NULLIF(count(*), 0))::numeric), 1) AS attendance_rate_pct
   FROM (public.attendance a
     JOIN public.branches b ON ((b.id = a.branch_id)))
  GROUP BY b.name, b.id, a.date
  ORDER BY a.date DESC, (round((((count(*) FILTER (WHERE (a.status = ANY (ARRAY['PRESENT'::public.attendance_status, 'LATE'::public.attendance_status]))))::numeric * 100.0) / (NULLIF(count(*), 0))::numeric), 1)) DESC;

CREATE TABLE public.events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    date date NOT NULL,
    branches text[] NOT NULL,
    age_groups text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.holidays (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    student_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT holidays_check CHECK ((end_date >= start_date))
);

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    attendance_id uuid NOT NULL,
    channel character varying(20) DEFAULT 'telegram'::character varying,
    status character varying(10) DEFAULT 'pending'::character varying,
    sent_at timestamp with time zone,
    error_msg text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying])::text[])))
);

CREATE TABLE public.parents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    name character varying(150),
    telegram_chat_id bigint,
    phone character varying(20),
    registered_at timestamp with time zone,
    email character varying(255),
    pending_chat_id bigint,
    pending_student_id uuid
);

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid,
    branch_id uuid,
    amount numeric(10,2) NOT NULL,
    month character varying(20) NOT NULL,
    year integer NOT NULL,
    paid_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying,
    receipt_no character varying(30) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    issued_by character varying(100)
);

CREATE TABLE public.school_calendar (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    date date NOT NULL,
    label character varying(100),
    is_off_day boolean DEFAULT true,
    end_date date
);

CREATE TABLE public.students (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    class_id uuid,
    name character varying(150) NOT NULL,
    student_no character varying(50) NOT NULL,
    qr_code_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    date_of_birth date,
    monthly_fee numeric(10,2) DEFAULT 0,
    age_group character varying(20)
);

CREATE TABLE public.user_branch_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    branch_id uuid,
    role character varying(20) NOT NULL,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_branch_roles_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'branch_admin'::character varying, 'teacher'::character varying])::text[])))
);

ALTER TABLE ONLY public.app_users ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_users ADD CONSTRAINT app_users_username_key UNIQUE (username);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
ALTER TABLE ONLY public.branches ADD CONSTRAINT branches_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.branches ADD CONSTRAINT branches_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.holidays ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.parents ADD CONSTRAINT parents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.parents ADD CONSTRAINT parents_student_id_key UNIQUE (student_id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_receipt_no_key UNIQUE (receipt_no);
ALTER TABLE ONLY public.school_calendar ADD CONSTRAINT school_calendar_branch_id_date_key UNIQUE (branch_id, date);
ALTER TABLE ONLY public.school_calendar ADD CONSTRAINT school_calendar_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.students ADD CONSTRAINT students_branch_id_student_no_key UNIQUE (branch_id, student_no);
ALTER TABLE ONLY public.students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT unique_student_date UNIQUE (student_id, date);
ALTER TABLE ONLY public.user_branch_roles ADD CONSTRAINT user_branch_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_branch_roles ADD CONSTRAINT user_branch_roles_user_id_branch_id_key UNIQUE (user_id, branch_id);

CREATE INDEX idx_attendance_branch_date ON public.attendance USING btree (branch_id, date);
CREATE INDEX idx_attendance_date ON public.attendance USING btree (date);
CREATE INDEX idx_attendance_student ON public.attendance USING btree (student_id);

CREATE TRIGGER on_holiday_insert AFTER INSERT ON public.holidays FOR EACH ROW EXECUTE FUNCTION public.insert_holiday_attendance();

ALTER TABLE ONLY public.app_users ADD CONSTRAINT app_users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.classes ADD CONSTRAINT classes_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.holidays ADD CONSTRAINT holidays_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.holidays ADD CONSTRAINT holidays_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.holidays ADD CONSTRAINT holidays_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.parents ADD CONSTRAINT parents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);
ALTER TABLE ONLY public.school_calendar ADD CONSTRAINT school_calendar_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE ONLY public.students ADD CONSTRAINT students_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE ONLY public.user_branch_roles ADD CONSTRAINT user_branch_roles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_branch_roles ADD CONSTRAINT user_branch_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branch_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow anon update password" ON public.app_users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_all_events ON public.events TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_all_payments ON public.payments TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_holidays ON public.holidays FOR DELETE TO anon USING (true);
CREATE POLICY anon_delete_school_calendar ON public.school_calendar FOR DELETE TO anon USING (true);
CREATE POLICY anon_delete_students ON public.students FOR DELETE TO anon USING (true);
CREATE POLICY anon_insert_attendance ON public.attendance FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_holidays ON public.holidays FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_parents ON public.parents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_school_calendar ON public.school_calendar FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_students ON public.students FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_read_app_users ON public.app_users FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_attendance ON public.attendance FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_holidays ON public.holidays FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_parents ON public.parents FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_school_calendar ON public.school_calendar FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_students ON public.students FOR SELECT TO anon USING (true);
CREATE POLICY anon_update_attendance ON public.attendance FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_update_students ON public.students FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY branch_attendance ON public.attendance USING ((public.is_super_admin() OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY branch_classes ON public.classes USING ((public.is_super_admin() OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY branch_holidays ON public.holidays USING ((public.is_super_admin() OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY branch_notifications ON public.notifications USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.attendance a
  WHERE ((a.id = notifications.attendance_id) AND (a.branch_id = ANY (public.get_my_branch_ids())))))));
CREATE POLICY branch_parents ON public.parents USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = parents.student_id) AND (s.branch_id = ANY (public.get_my_branch_ids())))))));
CREATE POLICY branch_students ON public.students USING ((public.is_super_admin() OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY manage_calendar ON public.school_calendar USING ((public.is_super_admin() OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY own_roles ON public.user_branch_roles FOR SELECT USING ((public.is_super_admin() OR (user_id = auth.uid())));
CREATE POLICY public_read_branches ON public.branches FOR SELECT USING (true);
CREATE POLICY public_read_classes ON public.classes FOR SELECT USING (true);
CREATE POLICY read_calendar ON public.school_calendar FOR SELECT USING ((public.is_super_admin() OR (branch_id IS NULL) OR (branch_id = ANY (public.get_my_branch_ids()))));
CREATE POLICY read_own_branches ON public.branches FOR SELECT USING ((public.is_super_admin() OR (id = ANY (public.get_my_branch_ids()))));
