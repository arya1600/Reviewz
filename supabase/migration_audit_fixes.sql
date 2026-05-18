-- ============================================================
-- ReviewBoost AI — Audit Fixes
-- Run AFTER all previous migrations.
-- ============================================================


-- ── Critical 1: Tighten stores public SELECT ──────────────────
-- Old policy: USING (true) — any caller could enumerate every
-- store slug, google_review_link, and business_id.
-- New policy: only expose active (non-suspended) stores, and
-- only the columns the customer QR flow needs via a view below.

DROP POLICY IF EXISTS "public_read_stores" ON stores;

-- Covers ONLY anonymous (unauthenticated) callers — e.g. customers scanning a QR.
-- Authenticated owners are covered by "owner_manage_stores" (business_id subquery).
-- Authenticated admins  are covered by "admin_all_stores"   (is_admin()).
-- An OR auth.uid() IS NOT NULL branch would be OR true for any logged-in user,
-- exposing every tenant's store rows — that is the bug this replaces.
CREATE POLICY "public_read_stores"
  ON stores FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');

-- View exposing only safe store columns to anonymous callers.
-- Inherits RLS from the underlying table (security_invoker = true).
CREATE OR REPLACE VIEW stores_public
  WITH (security_invoker = true)
AS
SELECT
  id,
  business_id,
  store_name,
  city,
  slug,
  google_review_link,
  status,
  last_scan_at,
  created_at
FROM stores;

GRANT SELECT ON stores_public TO anon, authenticated;


-- ── Critical 3: Auto-update last_scan_at via trigger ─────────
-- Anonymous customers have no UPDATE policy on stores, so the
-- client-side update always fails. Move this to a server-side
-- trigger that fires on every store_scans insert instead.

CREATE OR REPLACE FUNCTION update_store_last_scan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stores
  SET last_scan_at = NOW()
  WHERE id = NEW.store_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_last_scan ON store_scans;

CREATE TRIGGER trg_store_last_scan
  AFTER INSERT ON store_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_store_last_scan();
