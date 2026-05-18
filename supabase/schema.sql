-- ============================================================
-- ReviewBoost AI — Canonical Schema (fully consolidated)
-- This file reflects the production state after ALL migrations.
-- New environments should run ONLY this file — no need to apply
-- migration_*.sql files on top.
-- ============================================================

-- ── businesses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- nullable: admin-created rows have no auth user
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL,
  location              TEXT NOT NULL,
  google_link           TEXT NOT NULL DEFAULT '',
  description           TEXT,
  highlights            TEXT,
  vibe                  TEXT[] DEFAULT '{}',
  products              TEXT,
  staff_names           TEXT,
  customer_types        TEXT,
  complimented_features TEXT,
  tone_preference       TEXT DEFAULT 'casual',
  review_length         TEXT DEFAULT 'medium',
  owner_name            TEXT,
  email                 TEXT,
  phone                 TEXT,
  plan_type             TEXT DEFAULT 'monthly',
  status                TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'inactive')),
  onboarding_complete   BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── scans (legacy — pre-store flow) ──────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  scanned_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── reviews (legacy — pre-store flow) ────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  type        TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
  feedback    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── admin_users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY,   -- same UUID as auth.users
  email      TEXT NOT NULL UNIQUE,
  role       TEXT DEFAULT 'super_admin'
    CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── stores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id        UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  store_name         TEXT NOT NULL,
  city               TEXT NOT NULL DEFAULT '',
  slug               TEXT UNIQUE NOT NULL,
  google_review_link TEXT NOT NULL DEFAULT '',
  status             TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'suspended')),
  last_scan_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  plan_duration TEXT NOT NULL
    CHECK (plan_duration IN ('trial', 'monthly', '3months', '6months', '12months')),
  plan_name     TEXT DEFAULT 'manual',
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date   DATE NOT NULL,
  status        TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'pending', 'suspended')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── payments ─────────────────────────────────────────────────
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

-- ── store_scans ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_scans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── store_reviews ─────────────────────────────────────────────
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

ALTER TABLE businesses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_scans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- ── Admin helper ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
$$;

-- ── businesses ───────────────────────────────────────────────
-- Owner: full access to their own rows
CREATE POLICY "owners_all_businesses"
  ON businesses FOR ALL
  USING (auth.uid() = user_id);

-- Admin: full access to all rows
CREATE POLICY "admin_all_businesses"
  ON businesses FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Anonymous QR customers: read active businesses only.
-- Authenticated non-admin users are covered by owners_all_businesses.
-- Do NOT add OR auth.uid() IS NOT NULL — that is OR true and leaks all rows.
CREATE POLICY "public_read_businesses"
  ON businesses FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');

-- ── scans ─────────────────────────────────────────────────────
CREATE POLICY "public_insert_scans"  ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "owner_read_scans"     ON scans FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── reviews ───────────────────────────────────────────────────
CREATE POLICY "public_insert_reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "owner_read_reviews"    ON reviews FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── admin_users ───────────────────────────────────────────────
CREATE POLICY "admin_read_own_record"
  ON admin_users FOR SELECT USING (id = auth.uid());

-- ── stores ────────────────────────────────────────────────────
CREATE POLICY "admin_all_stores"
  ON stores FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "owner_manage_stores"
  ON stores FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Anonymous: only active stores (same logic as businesses above)
CREATE POLICY "public_read_stores"
  ON stores FOR SELECT
  USING (auth.uid() IS NULL AND status = 'active');

-- ── subscriptions ─────────────────────────────────────────────
CREATE POLICY "admin_all_subscriptions"
  ON subscriptions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "owner_read_subscriptions"
  ON subscriptions FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── payments ──────────────────────────────────────────────────
CREATE POLICY "admin_all_payments"
  ON payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "owner_read_payments"
  ON payments FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── store_scans ───────────────────────────────────────────────
CREATE POLICY "public_insert_store_scans"
  ON store_scans FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_store_scans"
  ON store_scans FOR SELECT USING (is_admin());

CREATE POLICY "owner_read_store_scans"
  ON store_scans FOR SELECT
  USING (store_id IN (
    SELECT s.id FROM stores s
    JOIN businesses b ON b.id = s.business_id
    WHERE b.user_id = auth.uid()
  ));

-- ── store_reviews ─────────────────────────────────────────────
CREATE POLICY "public_insert_store_reviews"
  ON store_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_store_reviews"
  ON store_reviews FOR SELECT USING (is_admin());

CREATE POLICY "owner_read_store_reviews"
  ON store_reviews FOR SELECT
  USING (store_id IN (
    SELECT s.id FROM stores s
    JOIN businesses b ON b.id = s.business_id
    WHERE b.user_id = auth.uid()
  ));


-- ============================================================
-- Public views (column-scoped; inherit RLS via security_invoker)
-- ============================================================

CREATE OR REPLACE VIEW businesses_public
  WITH (security_invoker = true)
AS
SELECT id, name, category, location, google_link,
       description, highlights, vibe, products, staff_names,
       customer_types, complimented_features, tone_preference,
       review_length, status
FROM businesses;

GRANT SELECT ON businesses_public TO anon, authenticated;

CREATE OR REPLACE VIEW stores_public
  WITH (security_invoker = true)
AS
SELECT id, business_id, store_name, city, slug,
       google_review_link, status, last_scan_at, created_at
FROM stores;

GRANT SELECT ON stores_public TO anon, authenticated;


-- ============================================================
-- Functions
-- ============================================================

-- Subscription status check (used by QR landing page)
CREATE OR REPLACE FUNCTION get_business_subscription_status(p_business_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_status TEXT;
BEGIN
  SELECT CASE
    WHEN status = 'suspended'                              THEN 'suspended'
    WHEN status = 'active' AND expiry_date >= CURRENT_DATE THEN 'active'
    ELSE 'expired'
  END INTO v_status
  FROM subscriptions
  WHERE business_id = p_business_id
  ORDER BY expiry_date DESC
  LIMIT 1;
  RETURN COALESCE(v_status, 'none');
END;
$$;

-- Auto-expire overdue subscriptions (schedule daily via pg_cron)
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE subscriptions SET status = 'expired'
  WHERE status = 'active' AND expiry_date < CURRENT_DATE;

  UPDATE stores SET status = 'expired'
  WHERE status = 'active'
    AND business_id NOT IN (
      SELECT DISTINCT business_id FROM subscriptions
      WHERE status = 'active' AND expiry_date >= CURRENT_DATE
    );

  UPDATE stores SET status = 'active'
  WHERE status = 'expired'
    AND business_id IN (
      SELECT DISTINCT business_id FROM subscriptions
      WHERE status = 'active' AND expiry_date >= CURRENT_DATE
    );
END;
$$;

-- Auto-update stores.last_scan_at on every store_scans insert
CREATE OR REPLACE FUNCTION update_store_last_scan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE stores SET last_scan_at = NOW() WHERE id = NEW.store_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_last_scan ON store_scans;
CREATE TRIGGER trg_store_last_scan
  AFTER INSERT ON store_scans
  FOR EACH ROW EXECUTE FUNCTION update_store_last_scan();


-- ============================================================
-- Rate-limiting helpers (used by INSERT RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION check_scan_rate(p_business_id UUID)
RETURNS boolean LANGUAGE sql SECURITY DEFINER VOLATILE AS $$
  SELECT COUNT(*) < 30 FROM scans
  WHERE business_id = p_business_id AND scanned_at > NOW() - INTERVAL '1 minute'
$$;

CREATE OR REPLACE FUNCTION check_review_rate(p_business_id UUID)
RETURNS boolean LANGUAGE sql SECURITY DEFINER VOLATILE AS $$
  SELECT COUNT(*) < 10 FROM reviews
  WHERE business_id = p_business_id AND created_at > NOW() - INTERVAL '1 minute'
$$;

CREATE OR REPLACE FUNCTION check_store_scan_rate(p_store_id UUID)
RETURNS boolean LANGUAGE sql SECURITY DEFINER VOLATILE AS $$
  SELECT COUNT(*) < 30 FROM store_scans
  WHERE store_id = p_store_id AND scanned_at > NOW() - INTERVAL '1 minute'
$$;

CREATE OR REPLACE FUNCTION check_store_review_rate(p_store_id UUID)
RETURNS boolean LANGUAGE sql SECURITY DEFINER VOLATILE AS $$
  SELECT COUNT(*) < 10 FROM store_reviews
  WHERE store_id = p_store_id AND created_at > NOW() - INTERVAL '1 minute'
$$;

-- Replace open INSERT policies with rate-limited ones
DROP POLICY IF EXISTS "public_insert_scans"        ON scans;
DROP POLICY IF EXISTS "public_insert_reviews"       ON reviews;
DROP POLICY IF EXISTS "public_insert_store_scans"   ON store_scans;
DROP POLICY IF EXISTS "public_insert_store_reviews" ON store_reviews;

CREATE POLICY "public_insert_scans"
  ON scans FOR INSERT WITH CHECK (check_scan_rate(business_id));

CREATE POLICY "public_insert_reviews"
  ON reviews FOR INSERT WITH CHECK (check_review_rate(business_id));

CREATE POLICY "public_insert_store_scans"
  ON store_scans FOR INSERT WITH CHECK (check_store_scan_rate(store_id));

CREATE POLICY "public_insert_store_reviews"
  ON store_reviews FOR INSERT WITH CHECK (check_store_review_rate(store_id));


-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stores_slug            ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_business_id     ON stores(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry   ON subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payments_business      ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_store_scans_store      ON store_scans(store_id);
CREATE INDEX IF NOT EXISTS idx_store_reviews_store    ON store_reviews(store_id);
