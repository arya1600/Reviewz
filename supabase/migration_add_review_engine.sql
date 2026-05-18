-- Run this in your Supabase SQL Editor.
-- Adds the new review engine fields to the businesses table.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS products              TEXT,
  ADD COLUMN IF NOT EXISTS staff_names           TEXT,
  ADD COLUMN IF NOT EXISTS customer_types        TEXT,
  ADD COLUMN IF NOT EXISTS complimented_features TEXT,
  ADD COLUMN IF NOT EXISTS tone_preference       TEXT DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS review_length         TEXT DEFAULT 'medium';
