-- own_roles previously ran an inline EXISTS against user_branch_roles from within
-- a policy defined on user_branch_roles itself, which re-triggers RLS evaluation on
-- the same table and causes "infinite recursion detected in policy" errors.
-- Fix: use the existing SECURITY DEFINER helpers (which bypass RLS internally,
-- same as get_my_branch_ids() already does) instead of an inline subquery.
DROP POLICY own_roles ON public.user_branch_roles;
CREATE POLICY own_roles ON public.user_branch_roles
    FOR SELECT USING (
      user_id = auth.uid()
      OR (kindergarten_id = public.get_my_kindergarten_id() AND public.is_super_admin())
    );
