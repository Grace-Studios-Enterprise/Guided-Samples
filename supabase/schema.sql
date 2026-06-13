-- Run this in your Supabase SQL editor to set up the GRACE Enterprise schema

-- Projects table
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null default 'Untitled Design',
  phase_reached integer not null default 1,
  garment_type  text,
  garment_color text,
  thumbnail_url text,
  logo_url      text,
  garment_url   text,
  composite_url text,
  preview_urls  text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Tech packs table (1:1 with projects)
create table if not exists public.tech_packs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade not null unique,
  style_info  jsonb not null default '{}',
  measurements jsonb not null default '{}',
  pantones    jsonb not null default '[]',
  placements  jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row-level security: users can only see their own projects
alter table public.projects   enable row level security;
alter table public.tech_packs enable row level security;

create policy "Users can manage their own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own tech packs"
  on public.tech_packs for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = tech_packs.project_id
        and p.user_id = auth.uid()
    )
  );

-- Storage bucket for all generated/uploaded assets
insert into storage.buckets (id, name, public)
  values ('grace-assets', 'grace-assets', true)
  on conflict (id) do nothing;

create policy "Users can upload their own assets"
  on storage.objects for insert
  with check (bucket_id = 'grace-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own assets"
  on storage.objects for update
  using (bucket_id = 'grace-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view assets"
  on storage.objects for select
  using (bucket_id = 'grace-assets');
