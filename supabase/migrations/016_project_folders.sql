-- =============================================================================
-- Migration 016: Project folders
-- =============================================================================
-- Applies on top of supabase/schema.sql.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Run in Supabase SQL editor or via `supabase db push`.
-- =============================================================================
--
-- Lets users organize saved projects into folders. A project belongs to at most
-- one folder; folder_id NULL means it lives at the top level ("All Projects").
-- Deleting a folder sets its projects' folder_id back to NULL (set null) so the
-- projects themselves are never lost when a folder is removed.

create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null default 'New Folder',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists folder_id uuid references public.folders(id) on delete set null default null;

create index if not exists projects_folder_id_idx on public.projects(folder_id);

-- Row-level security: users can only see and manage their own folders.
alter table public.folders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'folders'
      and policyname = 'Users can manage their own folders'
  ) then
    create policy "Users can manage their own folders"
      on public.folders for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.folders is 'User-created folders for organizing projects.';
comment on column public.projects.folder_id is 'Folder this project belongs to; NULL = top level.';
