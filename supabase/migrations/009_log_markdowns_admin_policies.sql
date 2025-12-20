-- Commander-only write access for log_markdowns (templates).
-- Read remains available to all authenticated users.

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
