-- Add role column to feedback_votes to separate employer vs student votes
alter table public.feedback_votes
  add column role text not null default 'student'
  check (role in ('employer', 'student'));

-- Allow upsert (update existing votes)
create policy "Anyone can update own vote"
  on public.feedback_votes for update
  using (true)
  with check (true);
