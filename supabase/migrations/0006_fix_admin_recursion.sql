-- Fix infinite recursion: use a security definer function to check admin role
-- This function bypasses RLS so it won't trigger the policy recursion

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop the recursive policies
drop policy if exists "admin_select_all_users" on public.users;
drop policy if exists "admin_select_all_student_profiles" on public.student_profiles;
drop policy if exists "admin_select_all_company_profiles" on public.company_profiles;

-- Re-create using the safe function
create policy "admin_select_all_users" on public.users
  for select using (public.is_admin());

create policy "admin_select_all_student_profiles" on public.student_profiles
  for select using (public.is_admin());

create policy "admin_select_all_company_profiles" on public.company_profiles
  for select using (public.is_admin());
