-- ============================================================
-- ReviewBoost AI — Super Admin System Migration
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ── Extend businesses table ──────────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT,
  ADD COLUMN IF NOT EXISTS plan_type  TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'inactive'));

-- ── Admin users ──────────────────────────────────────────────
-- Maps to auth.users; manually insert the first super admin.
-- Example: INSERT INTO admin_users (id, email, role)
--          VALUES ('<your-auth-uid>', 'admin@reviewboost.ai', 'super_admin');
CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT DEFAULT 'super_admin'
    CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Security-definer helper (used in RLS policies) ───────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
$$;

-- ── Store locations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  store_name          TEXT NOT NULL,
  city                TEXT NOT NULL DEFAULT '',
  slug                TEXT UNIQUE NOT NULL,        -- never changes; used in QR URL
  google_review_link  TEXT NOT NULL DEFAULT '',
  status              TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'suspended')),
  last_scan_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  plan_duration TEXT NOT NULL
    CHECK (plan_duration IN ('monthly', '3months', '6months', '12months')),
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date   DATE NOT NULL,
  status        TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'pending', 'suspended')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  transaction_id  TEXT,
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_date    TIMESTAMPTZ DEFAULT NOW(),
  plan_duration   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Store-level scan tracking ─────────────────────────────────
CREATE TABLE IF NOT EXISTS store_scans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Store-level review tracking ───────────────────────────────
CREATE TABLE IF NOT EXISTS store_reviews (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  type       TEXT CHECK (type IN ('positive', 'negative')),
  feedback   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- ── businesses (add admin policy to existing table) ──────────
-- Drop first to avoid duplicate errors on re-runs
DROP POLICY IF EXISTS "admin_all_businesses"    ON businesses;
DROP POLICY IF EXISTS "admin_update_businesses" ON businesses;

CREATE POLICY "admin_all_businesses"
  ON businesses FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── admin_users ───────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_own_record" ON admin_users;
CREATE POLICY "admin_read_own_record"
  ON admin_users FOR SELECT
  USING (id = auth.uid());

-- ── stores ───────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_stores"     ON stores;
DROP POLICY IF EXISTS "owner_manage_stores"  ON stores;
DROP POLICY IF EXISTS "public_read_stores"   ON stores;

CREATE POLICY "admin_all_stores"
  ON stores FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_manage_stores"
  ON stores FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "public_read_stores"
  ON stores FOR SELECT
  USING (true);

-- ── subscriptions ─────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_subscriptions"   ON subscriptions;
DROP POLICY IF EXISTS "owner_read_subscriptions"  ON subscriptions;

CREATE POLICY "admin_all_subscriptions"
  ON subscriptions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_read_subscriptions"
  ON subscriptions FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── payments ─────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_payments"  ON payments;
DROP POLICY IF EXISTS "owner_read_payments" ON payments;

CREATE POLICY "admin_all_payments"
  ON payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_read_payments"
  ON payments FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── store_scans ───────────────────────────────────────────────
ALTER TABLE store_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_store_scans" ON store_scans;
DROP POLICY IF EXISTS "admin_read_store_scans"    ON store_scans;
DROP POLICY IF EXISTS "owner_read_store_scans"    ON store_scans;

CREATE POLICY "public_insert_store_scans"
  ON store_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin_read_store_scans"
  ON store_scans FOR SELECT
  USING (is_admin());

CREATE POLICY "owner_read_store_scans"
  ON store_scans FOR SELECT
  USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN businesses b ON b.id = s.business_id
      WHERE b.user_id = auth.uid()
    )
  );

-- ── store_reviews ─────────────────────────────────────────────
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_store_reviews" ON store_reviews;
DROP POLICY IF EXISTS "admin_read_store_reviews"    ON store_reviews;
DROP POLICY IF EXISTS "owner_read_store_reviews"    ON store_reviews;

CREATE POLICY "public_insert_store_reviews"
  ON store_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin_read_store_reviews"
  ON store_reviews FOR SELECT
  USING (is_admin());

CREATE POLICY "owner_read_store_reviews"
  ON store_reviews FOR SELECT
  USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN businesses b ON b.id = s.business_id
      WHERE b.user_id = auth.uid()
    )
  );

-- ============================================================
-- Subscription check function (used by QR landing page)
-- Returns: 'active' | 'expired' | 'suspended' | 'none'
-- ============================================================
CREATE OR REPLACE FUNCTION get_business_subscription_status(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT
    CASE
      WHEN status = 'suspended' THEN 'suspended'
      WHEN status = 'active' AND expiry_date >= CURRENT_DATE THEN 'active'
      ELSE 'expired'
    END
  INTO v_status
  FROM subscriptions
  WHERE business_id = p_business_id
  ORDER BY expiry_date DESC
  LIMIT 1;

  RETURN COALESCE(v_status, 'none');
END;
$$;

-- ============================================================
-- Auto-expire subscriptions (call this daily via pg_cron or Edge Function)
-- Example pg_cron (requires Supabase Pro):
--   SELECT cron.schedule('0 0 * * *', $$SELECT auto_expire_subscriptions()$$);
-- ============================================================
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark overdue subscriptions as expired
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expiry_date < CURRENT_DATE;

  -- Expire store QR flows for businesses with no active subscription
  UPDATE stores
  SET status = 'expired'
  WHERE status = 'active'
    AND business_id NOT IN (
      SELECT DISTINCT business_id
      FROM subscriptions
      WHERE status = 'active'
        AND expiry_date >= CURRENT_DATE
    );

  -- Re-activate stores when business has a renewed active subscription
  UPDATE stores
  SET status = 'active'
  WHERE status IN ('expired')
    AND business_id IN (
      SELECT DISTINCT business_id
      FROM subscriptions
      WHERE status = 'active'
        AND expiry_date >= CURRENT_DATE
    );
END;
$$;

-- ============================================================
-- Useful indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_slug            ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_business_id     ON stores(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry   ON subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payments_business      ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_store_scans_store      ON store_scans(store_id);
