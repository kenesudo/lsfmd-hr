-- Replace generic application log process_type with per-status process types.
-- Also keeps existing non-application process types.

ALTER TABLE public.log_markdowns
  DROP CONSTRAINT IF EXISTS log_markdowns_process_type_check;

-- Migrate any existing generic application row to a specific status type so the new CHECK passes.
UPDATE public.log_markdowns
SET process_type = 'application_pending_interview'
WHERE process_type = 'application';

-- Migrate legacy reinstatement rows to on-hold (closest previous meaning).
UPDATE public.log_markdowns
SET process_type = 'reinstatement_on_hold'
WHERE process_type = 'reinstatement';

ALTER TABLE public.log_markdowns
  ADD CONSTRAINT log_markdowns_process_type_check
  CHECK (
    process_type IN (
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
      'reinstatement_interview',

      'training_orientation',
      'training_practical',
      'training_exam',
      'training_tf_creation',
      'training_tf_closure',

      'lr_interview'
    )
  );
