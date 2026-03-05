-- Anonymous feedback votes
create table if not exists public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  choice text not null check (choice in ('interested', 'needs_more', 'not_for_me')),
  fingerprint text not null,
  created_at timestamptz not null default now()
);

-- One vote per fingerprint
create unique index if not exists feedback_votes_fingerprint_idx on public.feedback_votes (fingerprint);

-- Allow anonymous inserts (no auth required)
alter table public.feedback_votes enable row level security;

create policy "Anyone can insert a vote"
  on public.feedback_votes for insert
  with check (true);

create policy "Anyone can read vote counts"
  on public.feedback_votes for select
  using (true);
