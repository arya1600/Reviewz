-- ============================================================
-- ReviewBoost AI — Security Hardening
-- Run in your Supabase SQL Editor AFTER all other migrations.
-- ============================================================


-- ── Issue 13a: Tighten public_read_businesses ─────────────────
-- Old policy: USING (true) — exposes every row to anyone,
-- including suspended businesses and sensitive admin columns.
-- New policy: only active businesses are publicly readable,
-- and sensitive fields are hidden via businesses_public view below.

DROP POLICY IF EXISTS "public_read_businesses" ON businesses;

-- Covers ONLY anonymous (unauthenticated) callers.
-- Authenticated owners are covered by "owners_all_businesses" (user_id match).
-- Authenticated admins  are covered by "admin_all_businesses"  (is_admin()).
-- Adding OR auth.uid() IS NOT NULL would be OR true for any logged-in user,
-- letting them read every tenant's data — that is the bug this replaces.
CREATE POLICY "public_read_businesses"
  ON businesses FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');


-- ── Issue 13b: Column-scoped public view ─────────────────────
-- RLS is row-level only; to prevent sensitive columns (email,
-- phone, owner_name, user_id, plan_type, onboarding_complete)
-- from leaking to anonymous callers, expose only the fields the
-- customer-facing QR flow actually needs through this view.
-- The view inherits RLS from the underlying table automatically
-- when security_invoker = true (Postgres 15+ / Supabase).

CREATE OR REPLACE VIEW businesses_public
  WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  category,
  location,
  google_link,
  description,
  highlights,
  vibe,
  products,
  staff_names,
  customer_types,
  complimented_features,
  tone_preference,
  review_length,
  status
FROM businesses;

-- Grant anonymous (PostgREST / Supabase anon key) and authenticated
-- users SELECT on the view. Authenticated users still hit businesses
-- directly via owner/admin policies when they need full row access.
GRANT SELECT ON businesses_public TO anon, authenticated;


-- ── Issue 14: Rate-limiting on public INSERT policies ─────────
-- Prevents scripted spam from inflating scan / review counts.
-- Limits are intentionally generous to never block real customers
-- (a real customer is one person, not 30 per minute).


-- ── Rate-limit helpers ────────────────────────────────────────

-- Legacy `scans` table: max 30 inserts per business per minute
CREATE OR REPLACE FUNCTION check_scan_rate(p_business_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
VOLATILE
AS $$
  SELECT COUNT(*) < 30
  FROM scans
  WHERE business_id = p_business_id
    AND scanned_at > NOW() - INTERVAL '1 minute'
$$;

-- Legacy `reviews` table: max 10 inserts per business per minute
CREATE OR REPLACE FUNCTION check_review_rate(p_business_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
VOLATILE
AS $$
  SELECT COUNT(*) < 10
  FROM reviews
  WHERE business_id = p_business_id
    AND created_at > NOW() - INTERVAL '1 minute'
$$;

-- `store_scans` table: max 30 inserts per store per minute
CREATE OR REPLACE FUNCTION check_store_scan_rate(p_store_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
VOLATILE
AS $$
  SELECT COUNT(*) < 30
  FROM store_scans
  WHERE store_id = p_store_id
    AND scanned_at > NOW() - INTERVAL '1 minute'
$$;

-- `store_reviews` table: max 10 inserts per store per minute
CREATE OR REPLACE FUNCTION check_store_review_rate(p_store_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
VOLATILE
AS $$
  SELECT COUNT(*) < 10
  FROM store_reviews
  WHERE store_id = p_store_id
    AND created_at > NOW() - INTERVAL '1 minute'
$$;


-- ── Apply rate limits to INSERT policies ──────────────────────

-- Legacy scans
DROP POLICY IF EXISTS "public_insert_scans" ON scans;
CREATE POLICY "public_insert_scans"
  ON scans FOR INSERT
  WITH CHECK (check_scan_rate(business_id));

-- Legacy reviews
DROP POLICY IF EXISTS "public_insert_reviews" ON reviews;
CREATE POLICY "public_insert_reviews"
  ON reviews FOR INSERT
  WITH CHECK (check_review_rate(business_id));

-- Store scans
DROP POLICY IF EXISTS "public_insert_store_scans" ON store_scans;
CREATE POLICY "public_insert_store_scans"
  ON store_scans FOR INSERT
  WITH CHECK (check_store_scan_rate(store_id));

-- Store reviews
DROP POLICY IF EXISTS "public_insert_store_reviews" ON store_reviews;
CREATE POLICY "public_insert_store_reviews"
  ON store_reviews FOR INSERT
  WITH CHECK (check_store_review_rate(store_id));
