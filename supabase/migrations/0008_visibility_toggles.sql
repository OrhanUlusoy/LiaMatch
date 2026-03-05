-- Add visibility toggles for students and companies

-- Students can mark themselves as "open for LIA"
alter table public.student_profiles
  add column if not exists open_for_lia boolean not null default false;

-- Companies can mark themselves as "visible" on the listing
alter table public.company_profiles
  add column if not exists visible boolean not null default false;

-- Allow all authenticated users to read student profiles where open_for_lia = true
create policy "student_profiles_select_open"
on public.student_profiles
for select
to authenticated
using (open_for_lia = true);

-- Allow all authenticated users to read company profiles where visible = true
create policy "company_profiles_select_visible"
on public.company_profiles
for select
to authenticated
using (visible = true);

-- Companies need to read student profiles for their applicants
create policy "company_read_applicant_profiles"
on public.student_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    join public.internships i on i.id = a.internship_id
    where a.student_user_id = student_profiles.user_id
      and i.company_user_id = auth.uid()
  )
);
