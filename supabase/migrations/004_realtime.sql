-- =============================================================================
-- Migration 004: Enable Supabase Realtime for production sync
-- =============================================================================
-- Adds production_orders and production_order_events to the realtime
-- publication so both supplier and client portals receive live updates.
-- =============================================================================

-- Enable realtime on production_orders (stage changes)
alter publication supabase_realtime add table public.production_orders;

-- Enable realtime on production_order_events (audit log — drives notifications)
alter publication supabase_realtime add table public.production_order_events;

-- ─── Rollback ─────────────────────────────────────────────────────────────────
-- alter publication supabase_realtime drop table public.production_orders;
-- alter publication supabase_realtime drop table public.production_order_events;
