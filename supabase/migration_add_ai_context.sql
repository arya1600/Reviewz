-- Run this in your Supabase SQL Editor to add the new AI context columns.
-- Safe to run even if you already ran schema.sql earlier.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS highlights  TEXT,
  ADD COLUMN IF NOT EXISTS vibe        TEXT[] DEFAULT '{}';
