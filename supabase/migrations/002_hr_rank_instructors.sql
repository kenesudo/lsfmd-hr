ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS hr_rank_allowed;

ALTER TABLE public.profiles
  ADD CONSTRAINT hr_rank_allowed CHECK (
    hr_rank IN (
      'Probationary Instructor',
      'General Instructor',
      'Supervisory Instructor',
      'Assistant Commander',
      'Commander'
    )
  );

UPDATE public.profiles
SET hr_rank = CASE hr_rank
  WHEN 'Probationary' THEN 'Probationary Instructor'
  WHEN 'General' THEN 'General Instructor'
  WHEN 'Supervisor' THEN 'Supervisory Instructor'
  ELSE hr_rank
END
WHERE hr_rank IN ('Probationary', 'General', 'Supervisor');

UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data->>'hr_rank' = 'Probationary' THEN jsonb_set(raw_user_meta_data, '{hr_rank}', '"Probationary Instructor"', true)
  WHEN raw_user_meta_data->>'hr_rank' = 'General' THEN jsonb_set(raw_user_meta_data, '{hr_rank}', '"General Instructor"', true)
  WHEN raw_user_meta_data->>'hr_rank' = 'Supervisor' THEN jsonb_set(raw_user_meta_data, '{hr_rank}', '"Supervisory Instructor"', true)
  ELSE raw_user_meta_data
END
WHERE raw_user_meta_data->>'hr_rank' IN ('Probationary', 'General', 'Supervisor');
