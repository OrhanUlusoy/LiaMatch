-- Add match_weights column for customizable matching preferences
alter table student_profiles
  add column if not exists match_weights jsonb default '{"track":35,"skills":35,"city":20,"period":10}'::jsonb;

comment on column student_profiles.match_weights is 'Custom matching weight preferences {track, skills, city, period}';
