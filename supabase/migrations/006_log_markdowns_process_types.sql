ALTER TABLE public.log_markdowns
  DROP CONSTRAINT IF EXISTS log_markdowns_process_type_check;

ALTER TABLE public.log_markdowns
  ADD CONSTRAINT log_markdowns_process_type_check
  CHECK (
    process_type IN (
      'application',
      'application_interview',
      'training_orientation',
      'training_practical',
      'training_exam',
      'training_tf_creation',
      'training_tf_closure'
    )
  );
