-- Tribuno: esquema de cuentas, espacio privado, resenas, informes y VIP
-- Pega TODO este contenido en Supabase -> SQL Editor -> New query -> Run.

-- 1) Perfiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_vip boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2) Divisas favoritas de cada usuario (espacio privado) --------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
alter table public.favorites enable row level security;

drop policy if exists "favorites_own_all" on public.favorites;
create policy "favorites_own_all" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Resenas de divisas (lectura publica, escritura propia) -----------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

drop policy if exists "reviews_read_all" on public.reviews;
create policy "reviews_read_all" on public.reviews for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- 4) Informes para la comunidad (lectura publica, escritura propia) ---------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

drop policy if exists "reports_read_all" on public.reports;
create policy "reports_read_all" on public.reports for select using (true);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own" on public.reports for update using (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own" on public.reports for delete using (auth.uid() = user_id);

-- 5) VIP: solo lectura para el usuario; solo el servicio puede activarlo ----
--    Un trigger impide que un usuario se regale el VIP desde la web.
create or replace function public.protect_is_vip()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_vip is distinct from old.is_vip and auth.role() <> 'service_role' then
    new.is_vip := old.is_vip;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_vip on public.profiles;
create trigger protect_is_vip before update on public.profiles
for each row execute function public.protect_is_vip();
