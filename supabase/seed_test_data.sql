-- =============================================================
-- LiaMatch: Seed test data
-- Run this in Supabase SQL Editor (runs as service role)
-- =============================================================

-- 1. Create a test company user in auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'testcompany@example.com', '',
  now(), now(), now(), '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- The trigger will auto-create public.users row. Set role to company:
UPDATE public.users SET role = 'company' WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- 2. Create company profile
INSERT INTO public.company_profiles (user_id, company_name, city, website)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'TechLab Stockholm AB', 'Stockholm', 'https://techlab.se')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create test internships
INSERT INTO public.internships (company_user_id, title, description, city, period_start, period_end, track_focus, skills, seats) VALUES
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'MLOps Engineer Intern',
  'Hjälp oss bygga ML-pipelines med Kubernetes och Kubeflow. Du får jobba med riktiga produktionsmodeller.',
  'Stockholm',
  '2027-05-01', '2027-08-01',
  'MLOps',
  '["Python", "Kubernetes", "Docker", "MLflow", "CI/CD"]'::jsonb,
  2
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Data Engineer Intern',
  'Bygg datapipelines i vår moderna dataplattform. Arbeta med Spark, Airflow och BigQuery.',
  'Stockholm',
  '2027-05-15', '2027-08-15',
  'Data Engineering',
  '["Python", "SQL", "Spark", "Airflow", "GCP"]'::jsonb,
  1
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Fullstack Developer Intern',
  'Utveckla vår SaaS-plattform med Next.js och Node.js. Fokus på frontend men du behöver kunna hela stacken.',
  'Stockholm',
  '2027-06-01', '2027-09-01',
  'Webbutveckling',
  '["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL"]'::jsonb,
  2
);

-- Add a second fake company
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-ffffffffffff',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'testcompany2@example.com', '',
  now(), now(), now(), '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;

UPDATE public.users SET role = 'company' WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-ffffffffffff';

INSERT INTO public.company_profiles (user_id, company_name, city, website)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-ffffffffffff', 'Nordic AI Labs', 'Göteborg', 'https://nordicai.se')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.internships (company_user_id, title, description, city, period_start, period_end, track_focus, skills, seats) VALUES
(
  'aaaaaaaa-bbbb-cccc-dddd-ffffffffffff',
  'ML Engineer Intern',
  'Forskning och utveckling av NLP-modeller. Du får arbeta nära vårt AI-team i Göteborg.',
  'Göteborg',
  '2027-05-01', '2027-07-31',
  'ML',
  '["Python", "PyTorch", "NLP", "Transformers", "Docker"]'::jsonb,
  1
),
(
  'aaaaaaaa-bbbb-cccc-dddd-ffffffffffff',
  'DevOps / Cloud Intern',
  'Automatisera infrastruktur med Terraform och AWS. Perfekt för dig som gillar CI/CD och moln.',
  'Remote',
  '2027-05-01', '2027-08-01',
  'DevOps',
  '["AWS", "Terraform", "Docker", "GitHub Actions", "Linux"]'::jsonb,
  1
);
