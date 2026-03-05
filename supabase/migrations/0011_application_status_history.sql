-- Application status history for timeline feature
create table if not exists application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_status_history_app on application_status_history(application_id);

-- RLS
alter table application_status_history enable row level security;

-- Students can see history for their own applications
create policy "Students view own app history"
  on application_status_history for select
  using (
    exists (
      select 1 from applications a
      where a.id = application_status_history.application_id
        and a.student_user_id = auth.uid()
    )
  );

-- Companies can see history for applications to their internships
create policy "Companies view their app history"
  on application_status_history for select
  using (
    exists (
      select 1 from applications a
      join internships i on i.id = a.internship_id
      where a.id = application_status_history.application_id
        and i.company_user_id = auth.uid()
    )
  );

-- Admins full access
create policy "Admins full access status history"
  on application_status_history for all
  using (public.is_admin());

-- Insert policy for companies updating status
create policy "Companies insert status history"
  on application_status_history for insert
  with check (
    exists (
      select 1 from applications a
      join internships i on i.id = a.internship_id
      where a.id = application_status_history.application_id
        and i.company_user_id = auth.uid()
    )
  );

-- Trigger: auto-insert history row when application status changes
create or replace function track_application_status_change()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status then
    insert into application_status_history(application_id, old_status, new_status, changed_by)
    values (NEW.id, OLD.status, NEW.status, auth.uid());
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_application_status_change
  after update of status on applications
  for each row
  execute function track_application_status_change();
