CREATE TABLE IF NOT EXISTS public.bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_group TEXT NOT NULL CHECK (
    template_group IN (
      'application',
      'reinstatement',
      'trainings',
      'employee_profile_creation',
      'employee_profile_update'
    )
  ),
  status TEXT NOT NULL,
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bbc_templates_group_status_unique UNIQUE (template_group, status)
);

ALTER TABLE public.bbc_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY bbc_templates_read
  ON public.bbc_templates
  FOR SELECT
  TO authenticated
  USING (true);

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

CREATE TRIGGER bbc_templates_updated_at
  BEFORE UPDATE ON public.bbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO public.bbc_templates (template_group, status, template_code)
SELECT 'application', status, template_code FROM public.application_bbc_templates
ON CONFLICT (template_group, status) DO NOTHING;

INSERT INTO public.bbc_templates (template_group, status, template_code)
SELECT 'reinstatement', status, template_code FROM public.reinstatement_bbc_templates
ON CONFLICT (template_group, status) DO NOTHING;

INSERT INTO public.bbc_templates (template_group, status, template_code)
SELECT 'trainings', status, template_code FROM public.trainings_bbc_templates
ON CONFLICT (template_group, status) DO NOTHING;

INSERT INTO public.bbc_templates (template_group, status, template_code)
SELECT 'employee_profile_creation', status, template_code FROM public.employee_profile_bbc_templates
ON CONFLICT (template_group, status) DO NOTHING;

INSERT INTO public.bbc_templates (template_group, status, template_code)
SELECT 'employee_profile_update', status, template_code FROM public.employee_profile_update_log_templates
ON CONFLICT (template_group, status) DO NOTHING;

DROP TABLE IF EXISTS public.application_bbc_templates CASCADE;
DROP TABLE IF EXISTS public.reinstatement_bbc_templates CASCADE;
DROP TABLE IF EXISTS public.trainings_bbc_templates CASCADE;
DROP TABLE IF EXISTS public.employee_profile_bbc_templates CASCADE;
DROP TABLE IF EXISTS public.employee_profile_update_log_templates CASCADE;
