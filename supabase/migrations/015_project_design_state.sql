-- =============================================================================
-- Migration 015: Project design-state snapshot
-- =============================================================================
-- Applies on top of supabase/schema.sql (Design Studio baseline).
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Run in Supabase SQL editor or via `supabase db push`.
-- =============================================================================
--
-- The dedicated image columns (logo_url, garment_url, composite_url,
-- preview_urls) and garment_type/garment_color only capture enough to render a
-- dashboard thumbnail. They omit the data needed to actually re-edit a saved
-- project: the SVG source, the logo style, the per-view garment images, and the
-- uniform metadata (mode / sport / uniformType) that drives the tech pack and
-- reversible-jersey pricing.
--
-- design_state stores a self-contained snapshot of the in-app AppState with
-- every image field rewritten to its public storage URL, so opening a project
-- can restore the full editing state in one read.

alter table public.projects
  add column if not exists design_state jsonb default null;

comment on column public.projects.design_state is
  'Full AppState snapshot (images as storage URLs) used to restore a project for editing.';
