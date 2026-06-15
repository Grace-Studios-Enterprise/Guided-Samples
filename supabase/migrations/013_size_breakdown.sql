-- =============================================================================
-- Migration 013: Per-size quantity breakdown
-- =============================================================================
-- Clients choose how many pieces per size (e.g. 3 S, 4 M, 2 L) for both samples
-- and bulk runs. The breakdown is stored as a { size: qty } JSON map; its sum
-- equals production_quantity.
--
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS size_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;
