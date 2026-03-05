-- GDPR: Function to delete all user data and auth account
-- Called from the API with service_role key

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete messages (sent by user)
  delete from public.messages where sender_id = target_user_id;

  -- Delete applications
  delete from public.applications where student_id = target_user_id;

  -- Delete application status history for user's applications
  delete from public.application_status_history
    where application_id in (
      select id from public.applications where student_id = target_user_id
    );

  -- Delete notifications
  delete from public.notifications where user_id = target_user_id;

  -- Delete saved internships
  delete from public.saved_internships where user_id = target_user_id;

  -- Delete internships owned by user (company)
  delete from public.internships where company_id = target_user_id;

  -- Delete student profile
  delete from public.student_profiles where user_id = target_user_id;

  -- Delete company profile
  delete from public.company_profiles where user_id = target_user_id;

  -- Delete feedback votes
  delete from public.feedback_votes where visitor_id = (
    select id::text from public.feedback_visitors limit 0
  );
  -- Note: feedback_votes are anonymous (visitor_id based), not linked to user_id

  -- Delete user record
  delete from public.users where id = target_user_id;

  -- Delete auth user (requires service_role)
  delete from auth.users where id = target_user_id;
end;
$$;

-- Only allow service_role to call this function
revoke execute on function public.delete_user_data(uuid) from public;
revoke execute on function public.delete_user_data(uuid) from authenticated;
