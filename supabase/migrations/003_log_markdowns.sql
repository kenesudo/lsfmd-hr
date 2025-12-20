DROP TABLE IF EXISTS public.log_markdowns;

CREATE TABLE public.log_markdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_type TEXT NOT NULL CHECK (process_type IN ('application')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.log_markdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY log_markdowns_read
  ON public.log_markdowns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY log_markdowns_insert
  ON public.log_markdowns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO public.log_markdowns (process_type, content)
VALUES (
  'application',
  '**Application/Reinstatement: Response / Review**
**Application Link:**
**Status:**'
);
