-- Grant EXECUTE to anon on exactly the RPCs the app calls via the anon key.
-- Paste this into the Supabase SQL editor — do not run via CLI or Management API.
--
-- RPCs the app calls (all via the anon key):
--   verify_login              → loginWithCredentials
--   change_own_password       → changeOwnPassword
--   reset_user_password       → adminResetPassword (4-arg version added in C1 fix)
--   record_scan               → QR scanner
--   run_daily_absent_marking  → markAllAbsent
--   get_payments              → getPayments (H3: replaces direct table SELECT)
--   create_payment            → createPayment (H3: replaces direct table INSERT + generate_receipt_no)
--   get_receipt_by_id         → getReceiptById (H3: replaces direct table SELECT)
--
-- generate_receipt_no is now internal to create_payment — anon grant revoked in H3 SQL.
-- The stale 2-arg reset_user_password(uuid, text) is NOT granted here.

GRANT EXECUTE ON FUNCTION public.verify_login(text, text)                                                               TO anon;
GRANT EXECUTE ON FUNCTION public.change_own_password(uuid, text, text)                                                  TO anon;
GRANT EXECUTE ON FUNCTION public.reset_user_password(uuid, uuid, text, boolean)                                         TO anon;
GRANT EXECUTE ON FUNCTION public.record_scan(uuid)                                                                      TO anon;
GRANT EXECUTE ON FUNCTION public.run_daily_absent_marking(uuid)                                                         TO anon;
GRANT EXECUTE ON FUNCTION public.get_payments(uuid)                                                                     TO anon;
GRANT EXECUTE ON FUNCTION public.get_receipt_by_id(uuid)                                                                TO anon;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid, uuid, uuid, numeric, text, integer, date, text, text, text)       TO anon;
