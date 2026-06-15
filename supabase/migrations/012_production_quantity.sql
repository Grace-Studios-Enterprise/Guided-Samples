-- =============================================================================
-- Migration 012: Bulk production quantity
-- =============================================================================
-- Clients choose how many pieces to manufacture for the bulk run. The quantity
-- is captured when they pay the production deposit (SAMPLE path) or start
-- production (DIRECT path), and drives the deposit / final balance math.
--
-- Defaults to 1 so existing rows remain valid.
--
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS production_quantity integer NOT NULL DEFAULT 1;

ALTER TABLE public.production_orders
  ADD CONSTRAINT production_orders_quantity_positive
  CHECK (production_quantity >= 1) NOT VALID;
