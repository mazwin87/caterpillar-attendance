-- Migrate get_payments, create_payment, run_daily_absent_marking
-- from p_caller_id (caller-asserted) to auth.uid() (server-side).
--
-- Drop old signatures first — grants are automatically revoked on DROP.
-- New functions grant to authenticated only; anon callers get auth.uid()=null
-- which the IS NULL role check rejects.

DROP FUNCTION IF EXISTS public.get_payments(uuid);
DROP FUNCTION IF EXISTS public.create_payment(uuid, uuid, uuid, numeric, text, integer, date, text, text, text);
DROP FUNCTION IF EXISTS public.run_daily_absent_marking(uuid);

-- ── get_payments ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM app_users WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        p.id, p.student_id, p.branch_id, p.amount, p.month, p.year,
        p.paid_date, p.payment_method, p.receipt_no, p.notes,
        p.created_at, p.issued_by,
        json_build_object(
          'name',       s.name,
          'student_no', s.student_no,
          'branches',   json_build_object(
            'name',    b.name,
            'address', b.address,
            'phone',   b.phone,
            'email',   b.email,
            'website', b.website,
            'reg_no',  b.reg_no
          )
        ) AS students
      FROM payments p
      JOIN students s ON s.id = p.student_id
      JOIN branches b ON b.id = s.branch_id
    ) t
  );
END;
$$;

-- ── create_payment ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_payment(
  p_student_id     uuid,
  p_branch_id      uuid,
  p_amount         numeric,
  p_month          text,
  p_year           integer,
  p_paid_date      date,
  p_payment_method text,
  p_notes          text,
  p_issued_by      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role       text;
  v_receipt_no text;
  v_new_id     uuid;
  v_result     json;
BEGIN
  SELECT role INTO v_role FROM app_users WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT generate_receipt_no(p_branch_id) INTO v_receipt_no;

  INSERT INTO payments (
    student_id, branch_id, amount, month, year,
    paid_date, payment_method, notes, receipt_no, issued_by
  )
  VALUES (
    p_student_id, p_branch_id, p_amount, p_month, p_year,
    p_paid_date, p_payment_method, p_notes, v_receipt_no, p_issued_by
  )
  RETURNING id INTO v_new_id;

  SELECT json_build_object(
    'id',             p.id,
    'student_id',     p.student_id,
    'branch_id',      p.branch_id,
    'amount',         p.amount,
    'month',          p.month,
    'year',           p.year,
    'paid_date',      p.paid_date,
    'payment_method', p.payment_method,
    'receipt_no',     p.receipt_no,
    'notes',          p.notes,
    'created_at',     p.created_at,
    'issued_by',      p.issued_by,
    'students', json_build_object(
      'name',       s.name,
      'student_no', s.student_no,
      'branches',   json_build_object(
        'name',    b.name,
        'address', b.address,
        'phone',   b.phone,
        'email',   b.email,
        'website', b.website,
        'reg_no',  b.reg_no
      )
    )
  ) INTO v_result
  FROM payments p
  JOIN students s ON s.id = p.student_id
  JOIN branches b ON b.id = s.branch_id
  WHERE p.id = v_new_id;

  RETURN v_result;
END;
$$;

-- ── run_daily_absent_marking ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_daily_absent_marking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  today  date := (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  SELECT role INTO v_role FROM app_users WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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

-- Grant to authenticated only (anon callers are rejected by the IS NULL role check)
GRANT EXECUTE ON FUNCTION public.get_payments()                                                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid, uuid, numeric, text, integer, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_absent_marking()                                                  TO authenticated;
