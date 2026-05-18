-- ============================================================
-- ReviewBoost AI — Consolidated Fixes Migration
-- Run this in your Supabase SQL Editor AFTER migration_admin_system.sql
-- ============================================================

-- ── Issue 3: Add email column to businesses ───────────────────
-- The admin panel reads/writes businesses.email but the column
-- was never added in any prior migration.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ── Issue 4: Allow admin-created businesses without an owner ──
-- Admin inserts via the panel have no real auth.users row to
-- reference. Dropping NOT NULL lets user_id be NULL for those rows.
ALTER TABLE businesses
  ALTER COLUMN user_id DROP NOT NULL;

-- ── Issue 6: Allow 'trial' as a plan_duration ─────────────────
-- Onboarding inserts plan_duration = 'trial' but the original
-- migration_admin_system.sql only allows the four paid durations.
-- This block is idempotent — safe even if migration_trial.sql
-- was already applied.
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_duration_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_duration_check
  CHECK (plan_duration IN ('trial', 'monthly', '3months', '6months', '12months'));

-- Also add plan_name and onboarding_complete if not yet present
-- (idempotent equivalents of migration_trial.sql)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'manual';

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
