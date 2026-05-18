-- ============================================================
-- ReviewBoost AI — Critical RLS Fix: cross-tenant read exposure
-- Run this immediately in your Supabase SQL Editor.
-- ============================================================
--
-- Root cause
-- ----------
-- PostgreSQL combines permissive SELECT policies on the same table
-- with OR.  The previous "public_read_businesses" and
-- "public_read_stores" policies contained:
--
--   USING (auth.uid() IS NULL AND status = 'active'
--          OR auth.uid() IS NOT NULL)
--
-- For any logged-in user auth.uid() IS NOT NULL is always TRUE,
-- so that branch effectively became USING (true), letting any
-- authenticated business owner SELECT every row in the table —
-- including competitors' names, emails, phones, and Google links.
--
-- Fix
-- ---
-- The anonymous branch (QR customers) is correct and stays.
-- The authenticated branch is removed: owners are already covered
-- by "owners_all_businesses" / "owner_manage_stores" (user_id
-- predicate) and admins by "admin_all_businesses" / "admin_all_stores"
-- (is_admin() predicate).  No authenticated user needs a public
-- catch-all SELECT policy.
-- ============================================================


-- ── businesses ───────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_businesses" ON businesses;

CREATE POLICY "public_read_businesses"
  ON businesses FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');

-- Verify: run the queries below and confirm you see only rows
-- owned by the calling user (not all rows) when logged in as a
-- non-admin business owner.
--
--   SET LOCAL role TO authenticated;     -- simulate owner session
--   SELECT id, name FROM businesses;     -- should return only your rows
--   RESET role;


-- ── stores ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_stores" ON stores;

CREATE POLICY "public_read_stores"
  ON stores FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');

-- Note on suspended stores visible to QR customers
-- -------------------------------------------------
-- With this policy an anonymous caller scanning a suspended store's
-- QR gets a "not found" response (no row returned) rather than a
-- "suspended" message.  This is acceptable: both outcomes tell the
-- customer the QR is inactive, and not revealing the suspension
-- reason to the public is a reasonable privacy posture.
-- Authenticated owners still see their suspended stores via
-- "owner_manage_stores".
