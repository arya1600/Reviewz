-- ============================================================
-- ReviewBoost AI — Trial & Plan Name Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add plan_name to subscriptions so we can distinguish
-- trial vs paid plans (starter / growth / pro / manual)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'manual';

-- Update plan_duration check to allow 'trial' duration
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_duration_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_duration_check
  CHECK (plan_duration IN ('trial', 'monthly', '3months', '6months', '12months'));

-- Track onboarding completion on the businesses table
-- so we know whether to show onboarding or dashboard
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
