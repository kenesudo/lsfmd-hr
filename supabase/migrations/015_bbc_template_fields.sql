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

CREATE TRIGGER bbc_template_fields_updated_at
  BEFORE UPDATE ON public.bbc_template_fields
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
