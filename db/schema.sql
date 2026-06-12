-- GRACE Enterprise — database schema
-- Compatible with Supabase (PostgreSQL 15+)
-- Run this in the Supabase SQL editor.
--
-- All tables live in the `grace` schema so they are fully isolated
-- from any other projects sharing this Supabase instance.

-- ─────────────────────────────────────────
-- Create isolated namespace
-- ─────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS grace;

-- ─────────────────────────────────────────
-- Clean slate within the grace schema only
-- (does not touch any other project's tables)
-- ─────────────────────────────────────────

DROP TABLE IF EXISTS grace.tech_packs CASCADE;
DROP TABLE IF EXISTS grace.previews   CASCADE;
DROP TABLE IF EXISTS grace.designs    CASCADE;
DROP TABLE IF EXISTS grace.garments   CASCADE;
DROP TABLE IF EXISTS grace.logos      CASCADE;
DROP TABLE IF EXISTS grace.addresses  CASCADE;
DROP TABLE IF EXISTS grace.profiles   CASCADE;

-- ─────────────────────────────────────────
-- Profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────

CREATE TABLE grace.profiles (
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

CREATE TABLE grace.addresses (
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

CREATE INDEX idx_addresses_user_id ON grace.addresses(user_id);

-- ─────────────────────────────────────────
-- Design assets
-- ─────────────────────────────────────────

CREATE TABLE grace.logos (
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

CREATE INDEX idx_logos_user_id ON grace.logos(user_id);

CREATE TABLE grace.garments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled Garment',
  image_url    TEXT NOT NULL,
  garment_type TEXT NOT NULL DEFAULT 'hoodie',
  color        TEXT,
  prompt       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_garments_user_id ON grace.garments(user_id);

CREATE TABLE grace.designs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_id      UUID REFERENCES grace.logos(id) ON DELETE SET NULL,
  garment_id   UUID REFERENCES grace.garments(id) ON DELETE SET NULL,
  name         TEXT NOT NULL DEFAULT 'Untitled Design',
  canvas_json  JSONB,
  preview_url  TEXT,
  confirmed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designs_user_id ON grace.designs(user_id);

CREATE TABLE grace.previews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  UUID NOT NULL REFERENCES grace.designs(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_previews_design_id ON grace.previews(design_id);

-- ─────────────────────────────────────────
-- Tech Packs
-- ─────────────────────────────────────────

CREATE TABLE grace.tech_packs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  UUID NOT NULL REFERENCES grace.designs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Untitled Tech Pack',
  pdf_url    TEXT,
  fields     JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tech_packs_user_id   ON grace.tech_packs(user_id);
CREATE INDEX idx_tech_packs_design_id ON grace.tech_packs(design_id);

-- ─────────────────────────────────────────
-- Auto-update updated_at
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION grace.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON grace.profiles
  FOR EACH ROW EXECUTE FUNCTION grace.set_updated_at();

CREATE TRIGGER trg_designs_updated_at
  BEFORE UPDATE ON grace.designs
  FOR EACH ROW EXECUTE FUNCTION grace.set_updated_at();

CREATE TRIGGER trg_tech_packs_updated_at
  BEFORE UPDATE ON grace.tech_packs
  FOR EACH ROW EXECUTE FUNCTION grace.set_updated_at();

-- ─────────────────────────────────────────
-- Row Level Security
-- Open policies for now — tighten to auth.uid() = user_id when sign-in is live
-- ─────────────────────────────────────────

ALTER TABLE grace.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.logos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.garments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.designs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.previews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace.tech_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON grace.profiles   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.addresses  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.logos      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.garments   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.designs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.previews   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON grace.tech_packs FOR ALL USING (true) WITH CHECK (true);
