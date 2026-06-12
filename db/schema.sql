-- GRACE Enterprise — database schema
-- Compatible with Supabase (PostgreSQL 15+)
-- Run this in the Supabase SQL editor.
--
-- Drop and recreate all tables to clear any partial state from previous runs.

-- ─────────────────────────────────────────
-- Clean slate (reverse dependency order)
-- ─────────────────────────────────────────

DROP TABLE IF EXISTS tech_packs CASCADE;
DROP TABLE IF EXISTS previews   CASCADE;
DROP TABLE IF EXISTS designs    CASCADE;
DROP TABLE IF EXISTS garments   CASCADE;
DROP TABLE IF EXISTS logos      CASCADE;
DROP TABLE IF EXISTS addresses  CASCADE;
DROP TABLE IF EXISTS profiles   CASCADE;
DROP TABLE IF EXISTS sessions   CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- ─────────────────────────────────────────
-- Profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  phone       TEXT,
  brand_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Addresses
-- ─────────────────────────────────────────

CREATE TABLE addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street     TEXT NOT NULL,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  zip        TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'US',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ─────────────────────────────────────────
-- Design assets
-- ─────────────────────────────────────────

CREATE TABLE logos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Untitled Logo',
  image_url  TEXT NOT NULL,
  svg_url    TEXT,
  style      TEXT,
  color      TEXT,
  prompt     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logos_user_id ON logos(user_id);

CREATE TABLE garments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled Garment',
  image_url    TEXT NOT NULL,
  garment_type TEXT NOT NULL DEFAULT 'hoodie',
  color        TEXT,
  prompt       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_garments_user_id ON garments(user_id);

CREATE TABLE designs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_id      UUID REFERENCES logos(id) ON DELETE SET NULL,
  garment_id   UUID REFERENCES garments(id) ON DELETE SET NULL,
  name         TEXT NOT NULL DEFAULT 'Untitled Design',
  canvas_json  JSONB,
  preview_url  TEXT,
  confirmed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designs_user_id ON designs(user_id);

CREATE TABLE previews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_previews_design_id ON previews(design_id);

-- ─────────────────────────────────────────
-- Tech Packs
-- ─────────────────────────────────────────

CREATE TABLE tech_packs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Untitled Tech Pack',
  pdf_url    TEXT,
  fields     JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tech_packs_user_id   ON tech_packs(user_id);
CREATE INDEX idx_tech_packs_design_id ON tech_packs(design_id);

-- ─────────────────────────────────────────
-- Auto-update updated_at
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tech_packs_updated_at
  BEFORE UPDATE ON tech_packs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────
-- Row Level Security
-- Open policies for now — tighten to auth.uid() = user_id when sign-in is live
-- ─────────────────────────────────────────

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE garments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE previews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON profiles   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON addresses  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON logos      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON garments   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON designs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON previews   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tech_packs FOR ALL USING (true) WITH CHECK (true);
