-- Fix #1: Prevent users from escalating their own role
-- Drop the overly permissive update policy and replace with one that excludes role
drop policy if exists "users_update_own" on public.users;

-- Users can update their own row, but NOT the role column
-- We use a trigger to enforce this since RLS can't restrict columns directly
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only allow role change if performed by an admin (via service role or admin user)
  if OLD.role is distinct from NEW.role then
    if not public.is_admin() then
      raise exception 'Cannot change own role';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.users;
create trigger trg_prevent_role_change
  before update on public.users
  for each row
  execute function public.prevent_role_change();

-- Re-create the update policy (still limited to own row)
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Fix #16: Restrict student profile access for rejected applications
drop policy if exists "company_read_applicant_profiles" on public.student_profiles;
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
      and a.status <> 'rejected'
  )
);

-- Fix #17: Audit logging table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Only admins can read audit logs
create policy "admin_read_audit_logs" on public.audit_logs
  for select using (public.is_admin());

-- System can insert audit logs
create policy "system_insert_audit_logs" on public.audit_logs
  for insert with check (true);

create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);
