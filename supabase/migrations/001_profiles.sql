CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  lsfmd_rank text NOT NULL,
  hr_rank text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lsfmd_rank_allowed CHECK (
    lsfmd_rank IN (
      'Paramedic',
      'Senior Paramedic',
      'Lead Paramedic',
      'Lieutenant',
      'Captain',
      'Assistant Chief',
      'Chief'
    )
  ),
  CONSTRAINT hr_rank_allowed CHECK (
    hr_rank IN (
      'Probationary',
      'General',
      'Supervisor',
      'Assistant Commander',
      'Commander'
    )
  )
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE TABLE IF NOT EXISTS public.bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_group TEXT NOT NULL CHECK (
    template_group IN (
      'application',
      'reinstatement',
      'trainings',
      'employee_profile_creation',
      'employee_profile_update',
      'supervision'
    )
  ),
  status TEXT NOT NULL,
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bbc_templates_group_status_unique UNIQUE (template_group, status)
);

ALTER TABLE public.bbc_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bbc_templates_read ON public.bbc_templates;
CREATE POLICY bbc_templates_read
ON public.bbc_templates
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS bbc_templates_admin_write ON public.bbc_templates;
CREATE POLICY bbc_templates_admin_write
ON public.bbc_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
  )
);

DROP TRIGGER IF EXISTS bbc_templates_updated_at ON public.bbc_templates;
CREATE TRIGGER bbc_templates_updated_at
BEFORE UPDATE ON public.bbc_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.bbc_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.bbc_templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'select')),
  required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  default_value TEXT,
  options TEXT[],
  transform TEXT NOT NULL DEFAULT 'raw' CHECK (transform IN ('raw', 'bbc_list')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bbc_template_fields_unique_key UNIQUE (template_id, field_key)
);

ALTER TABLE public.bbc_template_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bbc_template_fields_read ON public.bbc_template_fields;
CREATE POLICY bbc_template_fields_read
ON public.bbc_template_fields
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS bbc_template_fields_admin_write ON public.bbc_template_fields;
CREATE POLICY bbc_template_fields_admin_write
ON public.bbc_template_fields
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
  )
);

DROP TRIGGER IF EXISTS bbc_template_fields_updated_at ON public.bbc_template_fields;
CREATE TRIGGER bbc_template_fields_updated_at
BEFORE UPDATE ON public.bbc_template_fields
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TABLE IF EXISTS public.log_markdowns;

CREATE TABLE public.log_markdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_type TEXT NOT NULL CHECK (
    process_type IN (
      'employee_profile_creation',
      'employee_profile_update',
      'application_on_hold',
      'application_hired',
      'application_blacklisted',
      'application_closed',
      'application_denied',
      'application_pending_interview',
      'application_pending_badge',
      'reinstatement_on_hold',
      'reinstatement_denied',
      'reinstatement_exam_failed',
      'reinstatement_pending_exam',
      'reinstatement_pending_recommendations',
      'reinstatement_pending_badge',
      'training_orientation',
      'training_practical',
      'training_exam',
      'training_tf_creation',
      'training_tf_closure',
      'lr_interview',
      'supervision',
      'supervision_interview',
      'supervision_orentation',
      'supervision_practical',
      'supervision_reinstatement_exam',
      'supervision_exam',
      'supervision_reinst_exam'
    )
  ),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT log_markdowns_process_type_unique UNIQUE (process_type)
);

ALTER TABLE public.log_markdowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS log_markdowns_read ON public.log_markdowns;
CREATE POLICY log_markdowns_read
ON public.log_markdowns
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS log_markdowns_admin_write ON public.log_markdowns;
CREATE POLICY log_markdowns_admin_write
ON public.log_markdowns
FOR ALL
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

CREATE TABLE IF NOT EXISTS public.hr_activities_type (
  key TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.hr_activities_type (key, score)
VALUES
  ('employee_profile_creation', (floor(random() * 3) + 1)::int),
  ('employee_profile_update', (floor(random() * 3) + 1)::int),

  ('application_pending_interview', (floor(random() * 3) + 1)::int),
  ('application_pending_badge', (floor(random() * 3) + 1)::int),
  ('application_hired', (floor(random() * 3) + 1)::int),
  ('application_on_hold', (floor(random() * 3) + 1)::int),
  ('application_closed', (floor(random() * 3) + 1)::int),
  ('application_denied', (floor(random() * 3) + 1)::int),
  ('application_blacklisted', (floor(random() * 3) + 1)::int),

  ('reinstatement_on_hold', (floor(random() * 3) + 1)::int),
  ('reinstatement_pending_recommendations', (floor(random() * 3) + 1)::int),
  ('reinstatement_pending_exam', (floor(random() * 3) + 1)::int),
  ('reinstatement_pending_badge', (floor(random() * 3) + 1)::int),
  ('reinstatement_exam_failed', (floor(random() * 3) + 1)::int),
  ('reinstatement_denied', (floor(random() * 3) + 1)::int),

  ('training_orientation', (floor(random() * 3) + 1)::int),
  ('training_practical', (floor(random() * 3) + 1)::int),
  ('training_exam', (floor(random() * 3) + 1)::int),
  ('training_tf_creation', (floor(random() * 3) + 1)::int),
  ('training_tf_closure', (floor(random() * 3) + 1)::int),

  ('lr_interview', (floor(random() * 3) + 1)::int),

  ('supervision', (floor(random() * 3) + 1)::int),
  ('supervision_interview', (floor(random() * 3) + 1)::int),
  ('supervision_orentation', (floor(random() * 3) + 1)::int),
  ('supervision_practical', (floor(random() * 3) + 1)::int),
  ('supervision_reinstatement_exam', (floor(random() * 3) + 1)::int),
  ('supervision_exam', (floor(random() * 3) + 1)::int),

  ('application_response', (floor(random() * 3) + 1)::int),
  ('reinstatement_exam', (floor(random() * 3) + 1)::int),
  ('training', (floor(random() * 3) + 1)::int),
  ('training_file_creation', (floor(random() * 3) + 1)::int),
  ('training_file_closure', (floor(random() * 3) + 1)::int),
  ('personnel_profile_processed', (floor(random() * 3) + 1)::int),
  ('supervision_reinst_exam', (floor(random() * 3) + 1)::int)
ON CONFLICT (key) DO UPDATE
SET score = EXCLUDED.score;

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

-- Canonicalize BBC template statuses to match canonical process keys
UPDATE public.bbc_templates
SET status = 'application_pending_interview'
WHERE template_group = 'application' AND status = 'pending_interview';

UPDATE public.bbc_templates
SET status = 'application_pending_badge'
WHERE template_group = 'application' AND status = 'pending_badge';

UPDATE public.bbc_templates
SET status = 'application_hired'
WHERE template_group = 'application' AND status = 'hired';

UPDATE public.bbc_templates
SET status = 'application_on_hold'
WHERE template_group = 'application' AND status = 'on_hold';

UPDATE public.bbc_templates
SET status = 'application_closed'
WHERE template_group = 'application' AND status = 'closed';

UPDATE public.bbc_templates
SET status = 'application_denied'
WHERE template_group = 'application' AND status = 'denied';

UPDATE public.bbc_templates
SET status = 'application_blacklisted'
WHERE template_group = 'application' AND status = 'blacklisted';

UPDATE public.bbc_templates
SET status = 'reinstatement_on_hold'
WHERE template_group = 'reinstatement' AND status = 'on_hold';

UPDATE public.bbc_templates
SET status = 'reinstatement_pending_recommendations'
WHERE template_group = 'reinstatement' AND status = 'pending_recommendations';

UPDATE public.bbc_templates
SET status = 'reinstatement_pending_exam'
WHERE template_group = 'reinstatement' AND status = 'pending_exam';

UPDATE public.bbc_templates
SET status = 'reinstatement_pending_badge'
WHERE template_group = 'reinstatement' AND status = 'pending_badge';

UPDATE public.bbc_templates
SET status = 'reinstatement_exam_failed'
WHERE template_group = 'reinstatement' AND status = 'exam_failed';

UPDATE public.bbc_templates
SET status = 'reinstatement_denied'
WHERE template_group = 'reinstatement' AND status = 'denied';

UPDATE public.bbc_templates
SET status = 'training_tf_creation'
WHERE template_group = 'trainings' AND status IN ('creation', 'reopen');

UPDATE public.bbc_templates
SET status = 'training_tf_closure'
WHERE template_group = 'trainings' AND status = 'close';

UPDATE public.bbc_templates
SET status = 'training_orientation'
WHERE template_group = 'trainings' AND status = 'training_orientation';

UPDATE public.bbc_templates
SET status = 'training_practical'
WHERE template_group = 'trainings' AND status = 'training_practical';

UPDATE public.bbc_templates
SET status = 'training_exam'
WHERE template_group = 'trainings' AND status = 'exam';

UPDATE public.bbc_templates
SET status = 'training_orientation'
WHERE template_group = 'trainings' AND status = 'training';

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
