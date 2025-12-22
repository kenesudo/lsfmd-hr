CREATE TABLE IF NOT EXISTS public.hr_activities_type (
  key TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.hr_activities_type (key, score)
VALUES
  ('application_review', 2),
  ('application_response', 1),
  ('interview', 3),
  ('training_file_creation', 1),
  ('training_file_closure', 1),
  ('training', 3),
  ('reinstatement_exam', 5),
  ('supervision', 3),
  ('personnel_profile_processed', 1),
  ('roster_updated', 1)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hr_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bbc_content TEXT NOT NULL,
  activity_type TEXT NOT NULL REFERENCES public.hr_activities_type(key) ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deny_reason TEXT
);

ALTER TABLE public.hr_activities_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hr_activities_type_read ON public.hr_activities_type;
CREATE POLICY hr_activities_type_read
  ON public.hr_activities_type
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS hr_activities_type_admin_write ON public.hr_activities_type;
CREATE POLICY hr_activities_type_admin_write
  ON public.hr_activities_type
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

DROP POLICY IF EXISTS hr_activities_read_own ON public.hr_activities;
CREATE POLICY hr_activities_read_own
  ON public.hr_activities
  FOR SELECT
  TO authenticated
  USING (hr_id = auth.uid());

DROP POLICY IF EXISTS hr_activities_insert_own ON public.hr_activities;
CREATE POLICY hr_activities_insert_own
  ON public.hr_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (hr_id = auth.uid());

DROP POLICY IF EXISTS hr_activities_admin_read ON public.hr_activities;
CREATE POLICY hr_activities_admin_read
  ON public.hr_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

DROP POLICY IF EXISTS hr_activities_admin_update ON public.hr_activities;
CREATE POLICY hr_activities_admin_update
  ON public.hr_activities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

DROP TABLE IF EXISTS public.application_activities CASCADE;
DROP TABLE IF EXISTS public.reinstatement_activities CASCADE;
DROP TABLE IF EXISTS public.trainings_activities CASCADE;
DROP TABLE IF EXISTS public.employee_profile_activities CASCADE;
DROP TABLE IF EXISTS public.employee_profile_update_activities CASCADE;
