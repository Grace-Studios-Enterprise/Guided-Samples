-- =============================================================================
-- Migration 003: Supplier Portal access layer
-- =============================================================================
-- Extends production_orders RLS so authenticated suppliers can read/act on
-- orders assigned to them by email.  All supplier writes go through the
-- /api/supplier/transition API route (server-side, security-definer logic)
-- rather than direct table updates from the client.
-- =============================================================================

-- ─── 1. Supplier read access ──────────────────────────────────────────────────
-- Suppliers sign in with the same Supabase auth as brand owners.
-- They can see any production_order where supplier_email = their login email.

do $$ begin
  create policy "Suppliers can view their assigned orders"
    on public.production_orders for select
    using (supplier_email = auth.email());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Suppliers can read events for their assigned orders"
    on public.production_order_events for select
    using (
      exists (
        select 1 from public.production_orders po
        where po.id = production_order_events.production_order_id
          and po.supplier_email = auth.email()
      )
    );
exception when duplicate_object then null; end $$;

-- ─── 2. Supplier media tracking ───────────────────────────────────────────────
-- Media uploads (first piece photos, revised sample photos) are stored in
-- Supabase Storage and referenced here.

create table if not exists public.production_order_media (
  id                    uuid        primary key default gen_random_uuid(),
  production_order_id   uuid        not null
                          references public.production_orders(id)
                          on delete cascade,
  stage                 public.production_stage not null,
  media_type            text        not null
                          check (media_type in ('first_piece_review', 'revised_sample', 'qc_report', 'packing_photo', 'other')),
  storage_path          text        not null,   -- path in grace-assets bucket
  public_url            text        not null,
  file_name             text        not null,
  file_size_bytes       integer,
  mime_type             text,
  uploaded_by_email     text        not null,
  notes                 text,
  created_at            timestamptz not null default now()
);

comment on table public.production_order_media is
  'Media files (photos, PDFs) uploaded by suppliers during production stages.';

alter table public.production_order_media enable row level security;

do $$ begin
  create policy "Brand owners can view their order media"
    on public.production_order_media for select
    using (
      exists (
        select 1 from public.production_orders po
        where po.id = production_order_media.production_order_id
          and po.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Suppliers can view their order media"
    on public.production_order_media for select
    using (
      exists (
        select 1 from public.production_orders po
        where po.id = production_order_media.production_order_id
          and po.supplier_email = auth.email()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Suppliers can upload media for their assigned orders"
    on public.production_order_media for insert
    with check (
      uploaded_by_email = auth.email()
      and exists (
        select 1 from public.production_orders po
        where po.id = production_order_media.production_order_id
          and po.supplier_email = auth.email()
      )
    );
exception when duplicate_object then null; end $$;

-- ─── 3. Storage policy for production media ───────────────────────────────────
-- Media stored at: production-media/{orderId}/{stage}/{filename}

insert into storage.buckets (id, name, public)
  values ('production-media', 'production-media', false)
  on conflict (id) do nothing;

do $$ begin
  create policy "Suppliers can upload production media"
    on storage.objects for insert
    with check (
      bucket_id = 'production-media'
      and exists (
        select 1 from public.production_orders po
        where po.id::text = (storage.foldername(name))[1]
          and po.supplier_email = auth.email()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Suppliers can read their own production media"
    on storage.objects for select
    using (
      bucket_id = 'production-media'
      and exists (
        select 1 from public.production_orders po
        where po.id::text = (storage.foldername(name))[1]
          and (po.supplier_email = auth.email() or po.user_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

-- ─── 4. Indexes ───────────────────────────────────────────────────────────────

create index if not exists idx_production_orders_supplier_email
  on public.production_orders (supplier_email)
  where supplier_email is not null;

create index if not exists idx_production_order_media_order_id
  on public.production_order_media (production_order_id);

-- ─── 5. Rollback ──────────────────────────────────────────────────────────────
-- drop table if exists public.production_order_media cascade;
-- drop policy if exists "Suppliers can view their assigned orders" on public.production_orders;
-- drop policy if exists "Suppliers can read events for their assigned orders" on public.production_order_events;
-- drop index if exists idx_production_orders_supplier_email;
-- drop index if exists idx_production_order_media_order_id;
