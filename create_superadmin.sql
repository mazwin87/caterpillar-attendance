-- First check if superadmin already exists
SELECT id, username, role FROM app_users WHERE username = 'superadmin';

-- If empty, insert (branch_id left null for superadmin)
INSERT INTO app_users (username, password, role, must_change_password)
VALUES ('superadmin', 'Admin@1234', 'superadmin', false)
ON CONFLICT (username) DO UPDATE SET password = 'Admin@1234', role = 'superadmin';
