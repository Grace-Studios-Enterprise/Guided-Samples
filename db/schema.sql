-- GRACE Enterprise — database schema
-- Compatible with PostgreSQL 15+ (Supabase / Vercel Postgres / Neon)
-- Run this file once to initialize all tables.

-- ─────────────────────────────────────────
-- Users & Auth
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  brand_name    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ─────────────────────────────────────────
-- Addresses
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street     TEXT NOT NULL,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  zip        TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'US',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ─────────────────────────────────────────
-- Design assets
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS logos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Untitled Logo',
  image_url  TEXT NOT NULL,   -- stored in object storage (S3/R2/Vercel Blob)
  svg_url    TEXT,            -- vector version if available
  style      TEXT,
  color      TEXT,
  prompt     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logos_user_id ON logos(user_id);

CREATE TABLE IF NOT EXISTS garments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled Garment',
  image_url    TEXT NOT NULL,
  garment_type TEXT NOT NULL DEFAULT 'hoodie',
  color        TEXT,
  prompt       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garments_user_id ON garments(user_id);

CREATE TABLE IF NOT EXISTS designs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logo_id      UUID REFERENCES logos(id) ON DELETE SET NULL,
  garment_id   UUID REFERENCES garments(id) ON DELETE SET NULL,
  name         TEXT NOT NULL DEFAULT 'Untitled Design',
  canvas_json  JSONB,          -- logo position, scale, rotation on canvas
  preview_url  TEXT,           -- composite design image
  confirmed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);

CREATE TABLE IF NOT EXISTS previews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_previews_design_id ON previews(design_id);

-- ─────────────────────────────────────────
-- Tech Packs
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tech_packs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id   UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Tech Pack',
  pdf_url     TEXT,
  fields      JSONB NOT NULL DEFAULT '{}',  -- all measurement/spec fields
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_packs_user_id  ON tech_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_tech_packs_design_id ON tech_packs(design_id);

-- ─────────────────────────────────────────
-- Helper: auto-update updated_at
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_tech_packs_updated_at
  BEFORE UPDATE ON tech_packs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
