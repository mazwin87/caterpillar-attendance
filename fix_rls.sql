-- Run this in Supabase SQL Editor to update the reset function
CREATE OR REPLACE FUNCTION reset_user_password(p_user_id uuid, p_new_password text, p_must_change boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_users
  SET password = p_new_password, must_change_password = p_must_change
  WHERE id = p_user_id;
END;
$$;
