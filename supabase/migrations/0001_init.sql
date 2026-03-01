-- LiaMatch MVP schema (Supabase Postgres)

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.user_role as enum ('student', 'company', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'viewed', 'contacted', 'rejected', 'accepted');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role,
  created_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  track text not null,
  school text not null,
  city text not null,
  github_url text,
  linkedin_url text,
  project_title text,
  project_desc text,
  project_url text,
  availability_periods jsonb not null default '[]'::jsonb,
  cv_file_url text,
  pb_file_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.company_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  company_name text not null,
  city text not null,
  website text,
  updated_at timestamptz not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  company_user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null,
  city text not null,
  period_start date,
  period_end date,
  application_start date,
  application_end date,
  seats int not null default 1,
  track_focus text not null,
  skills jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists internships_company_user_id_idx on public.internships(company_user_id);
create index if not exists internships_city_idx on public.internships(city);
create index if not exists internships_track_focus_idx on public.internships(track_focus);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  student_user_id uuid not null references public.users (id) on delete cascade,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (internship_id, student_user_id)
);

create index if not exists applications_student_user_id_idx on public.applications(student_user_id);
create index if not exists applications_internship_id_idx on public.applications(internship_id);

-- Optional: cache table for precomputed match scores
create table if not exists public.match_scores (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.users(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  score int not null,
  reasons jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  unique(student_user_id, internship_id)
);

-- Trigger: create public.users row on new auth user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- RLS
alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.internships enable row level security;
alter table public.applications enable row level security;
alter table public.match_scores enable row level security;

-- Policies: users
create policy "users_select_own" on public.users
for select using (auth.uid() = id);

create policy "users_update_own" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies: student_profiles
create policy "student_profiles_select_own" on public.student_profiles
for select using (auth.uid() = user_id);

create policy "student_profiles_insert_own" on public.student_profiles
for insert with check (auth.uid() = user_id);

create policy "student_profiles_update_own" on public.student_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: company_profiles
create policy "company_profiles_select_own" on public.company_profiles
for select using (auth.uid() = user_id);

create policy "company_profiles_insert_own" on public.company_profiles
for insert with check (auth.uid() = user_id);

create policy "company_profiles_update_own" on public.company_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: internships
create policy "internships_select_public" on public.internships
for select using (true);

create policy "internships_insert_company_own" on public.internships
for insert with check (auth.uid() = company_user_id);

create policy "internships_update_company_own" on public.internships
for update using (auth.uid() = company_user_id) with check (auth.uid() = company_user_id);

create policy "internships_delete_company_own" on public.internships
for delete using (auth.uid() = company_user_id);

-- Policies: applications
create policy "applications_insert_student_own" on public.applications
for insert with check (auth.uid() = student_user_id);

create policy "applications_select_student_own" on public.applications
for select using (auth.uid() = student_user_id);

-- Company can read applications for its own internships
create policy "applications_select_company_own" on public.applications
for select using (
  exists (
    select 1
    from public.internships i
    where i.id = applications.internship_id
      and i.company_user_id = auth.uid()
  )
);

-- Company can update status for its own internships
create policy "applications_update_company_own" on public.applications
for update using (
  exists (
    select 1
    from public.internships i
    where i.id = applications.internship_id
      and i.company_user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.internships i
    where i.id = applications.internship_id
      and i.company_user_id = auth.uid()
  )
);

-- match_scores (optional)
create policy "match_scores_select_student_own" on public.match_scores
for select using (auth.uid() = student_user_id);

create policy "match_scores_upsert_student_own" on public.match_scores
for insert with check (auth.uid() = student_user_id);

create policy "match_scores_update_student_own" on public.match_scores
for update using (auth.uid() = student_user_id) with check (auth.uid() = student_user_id);

-- Storage (optional): create private bucket for documents
-- Note: requires the storage extension/schema in Supabase.
-- select storage.create_bucket('documents', public := false);
