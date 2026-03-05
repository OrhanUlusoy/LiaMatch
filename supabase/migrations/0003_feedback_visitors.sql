-- Track unique visitors to the feedback page
create table if not exists public.feedback_visitors (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  created_at timestamptz not null default now()
);

-- One entry per fingerprint
create unique index if not exists feedback_visitors_fingerprint_idx on public.feedback_visitors (fingerprint);

-- Allow anonymous access
alter table public.feedback_visitors enable row level security;

create policy "Anyone can register a visit"
  on public.feedback_visitors for insert
  with check (true);

create policy "Anyone can read visitor count"
  on public.feedback_visitors for select
  using (true);
