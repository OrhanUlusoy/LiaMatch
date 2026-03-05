-- Enhance feedback system for large-scale analysis
-- Add metadata columns for richer analytics

-- Add user_agent for device/browser analytics
alter table public.feedback_votes
  add column if not exists user_agent text;

-- Add page_url to know which page they came from
alter table public.feedback_votes
  add column if not exists page_url text;

-- Add updated_at to track vote changes over time
alter table public.feedback_votes
  add column if not exists updated_at timestamptz not null default now();

-- Index on created_at for time-series queries
create index if not exists feedback_votes_created_at_idx
  on public.feedback_votes (created_at desc);

-- Composite index for role + choice breakdown queries
create index if not exists feedback_votes_role_choice_idx
  on public.feedback_votes (role, choice);

-- Index on visitors for count queries
create index if not exists feedback_visitors_created_at_idx
  on public.feedback_visitors (created_at desc);
