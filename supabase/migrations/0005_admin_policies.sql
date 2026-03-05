-- Admin can read all users and profiles
create policy "admin_select_all_users" on public.users
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "admin_select_all_student_profiles" on public.student_profiles
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "admin_select_all_company_profiles" on public.company_profiles
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );
