-- Fix: run_daily_absent_marking was overwriting PRESENT/LATE records with ABSENT.
-- This version only inserts ABSENT for students with NO attendance record today.

CREATE OR REPLACE FUNCTION run_daily_absent_marking()
RETURNS void
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
