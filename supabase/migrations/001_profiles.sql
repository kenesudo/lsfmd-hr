create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  lsfmd_rank text not null,
  hr_rank text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lsfmd_rank_allowed check (
    lsfmd_rank in (
      'Paramedic',
      'Senior Paramedic',
      'Lead Paramedic',
      'Lieutenant',
      'Captain',
      'Assistant Chief',
      'Chief'
    )
  ),
  constraint hr_rank_allowed check (
    hr_rank in (
      'Probationary',
      'General',
      'Supervisor',
      'Assistant Commander',
      'Commander'
    )
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Users can read their own profile
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Users can update their own profile (but not role fields; enforce in app)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- No public inserts; Commander creates via server using secret key
