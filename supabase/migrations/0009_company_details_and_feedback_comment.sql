-- Add richer company profile fields
alter table public.company_profiles
  add column if not exists description text,
  add column if not exists vision text,
  add column if not exists looking_for text;

-- Add optional comment on feedback votes
alter table public.feedback_votes
  add column if not exists comment text;
