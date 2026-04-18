-- ============================================================================
-- Ma Diét — Schéma Supabase
-- ============================================================================
-- À appliquer UNE FOIS dans ton projet Supabase :
--   1. Ouvre ton projet sur https://supabase.com
--   2. SQL Editor → "New query"
--   3. Colle tout ce fichier
--   4. Run
--
-- Stratégie : chaque utilisateur voit uniquement ses données (Row Level
-- Security). Stockage léger : on stocke les données Zustand sérialisées
-- en JSONB par catégorie, pas un schéma relationnel complet (on garde le
-- code client simple et on sync juste des blobs).
-- ============================================================================

-- 1) Table principale : une ligne par utilisateur
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profiles jsonb not null default '[]'::jsonb,
  active_profile_id text,
  day_plans jsonb not null default '{}'::jsonb,
  favorites jsonb not null default '{}'::jsonb,
  weights jsonb not null default '{}'::jsonb,
  recipes jsonb not null default '{}'::jsonb,
  custom_foods jsonb not null default '[]'::jsonb,
  custom_templates jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '[]'::jsonb,
  water jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajout de la colonne water si la table existait déjà (idempotent)
alter table public.user_data
  add column if not exists water jsonb not null default '{}'::jsonb;

-- 2) Index pour les requêtes les plus fréquentes
create index if not exists user_data_updated_at_idx on public.user_data (updated_at desc);

-- 3) Row Level Security : chaque user ne voit que ses propres lignes
alter table public.user_data enable row level security;

drop policy if exists "Users can view own data" on public.user_data;
create policy "Users can view own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own data" on public.user_data;
create policy "Users can insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own data" on public.user_data;
create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own data" on public.user_data;
create policy "Users can delete own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- 4) Trigger pour mettre à jour updated_at automatiquement
create or replace function public.handle_user_data_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_user_data_update on public.user_data;
create trigger on_user_data_update
  before update on public.user_data
  for each row execute function public.handle_user_data_update();

-- 5) Trigger pour créer automatiquement une ligne user_data au signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_data (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Fait ! Toi et tes users pouvez maintenant vous inscrire et sync.
-- ============================================================================
