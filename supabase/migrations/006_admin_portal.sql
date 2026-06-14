-- =============================================================================
-- Migration 006: Admin Portal access layer
-- =============================================================================
-- Grants admin users (app_metadata.role = 'admin') read/write access to all
-- production data.  Admins are GRACE staff operating as the control tower —
-- they can see everything clients and suppliers cannot see about each other.
-- =============================================================================

-- ─── Helper: admin role check ─────────────────────────────────────────────────
-- Used in every admin RLS policy to avoid repetition.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

-- ─── production_orders: admin sees all ───────────────────────────────────────

create policy if not exists "Admins can view all production orders"
  on public.production_orders for select
  using (public.is_admin());

create policy if not exists "Admins can update all production orders"
  on public.production_orders for update
  using (public.is_admin());

-- ─── production_order_events: admin sees all ─────────────────────────────────

create policy if not exists "Admins can view all production order events"
  on public.production_order_events for select
  using (public.is_admin());

create policy if not exists "Admins can insert production order events"
  on public.production_order_events for insert
  with check (public.is_admin());

-- ─── production_order_media: admin sees all ───────────────────────────────────

create policy if not exists "Admins can view all order media"
  on public.production_order_media for select
  using (public.is_admin());

-- ─── notifications: admin can insert for any recipient ────────────────────────
-- (insert policy already exists as "Service role can insert notifications")
-- No additional policy needed — existing policy allows all inserts.

-- ─── Storage: admin can read all production media ─────────────────────────────

create policy if not exists "Admins can read all production media"
  on storage.objects for select
  using (
    bucket_id = 'production-media'
    and public.is_admin()
  );

-- ─── Admin notes: store in production_order_events with event_type = 'admin_note'
-- No new table needed — events table already supports arbitrary metadata.
-- event_type column accepts any text value; 'admin_note' is the convention.

-- ─── Rollback ─────────────────────────────────────────────────────────────────
-- drop policy if exists "Admins can view all production orders" on public.production_orders;
-- drop policy if exists "Admins can update all production orders" on public.production_orders;
-- drop policy if exists "Admins can view all production order events" on public.production_order_events;
-- drop policy if exists "Admins can insert production order events" on public.production_order_events;
-- drop policy if exists "Admins can view all order media" on public.production_order_media;
-- drop policy if exists "Admins can read all production media" on storage.objects;
-- drop function if exists public.is_admin();
