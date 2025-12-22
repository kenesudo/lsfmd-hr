ALTER TABLE public.bbc_templates
  DROP CONSTRAINT IF EXISTS bbc_templates_template_group_check;

ALTER TABLE public.bbc_templates
  ADD CONSTRAINT bbc_templates_template_group_check
  CHECK (
    template_group IN (
      'application',
      'reinstatement',
      'trainings',
      'employee_profile_creation',
      'employee_profile_update',
      'supervision'
    )
  );

INSERT INTO public.bbc_templates (template_group, status, template_code)
VALUES
  (
    'supervision',
    'supervision',
    $$[center][size=120][b]SUPERVISION LOG[/b][/size][/center]

[b]GI/PI's name:[/b] {{member_name}}
[b]Activity they have performed:[/b] {{activity_performed}} (Interview, Orentation, Practical, Reinst. Exam/exam)
[b]Personal Evaluation:[/b]
{{personal_evaluation}}

[b]Note/feedback:[/b]
{{note_feedback}}

[b]Screenshots:[/b]
{{screenshots}}
[i]Make sure to toggle every chat setting and send atleast 1 screenshot with /time.[/i]$$
  ),
  (
    'supervision',
    'supervision_interview',
    $$[center][size=120][b]SUPERVISION LOG — INTERVIEW[/b][/size][/center]

[b]GI/PI's name:[/b] {{member_name}}
[b]Activity they have performed:[/b] Interview
[b]Personal Evaluation:[/b]
{{personal_evaluation}}

[b]Note/feedback:[/b]
{{note_feedback}}

[b]Screenshots:[/b]
{{screenshots}}
[i]Make sure to toggle every chat setting and send atleast 1 screenshot with /time.[/i]$$
  ),
  (
    'supervision',
    'supervision_orentation',
    $$[center][size=120][b]SUPERVISION LOG — ORENTATION[/b][/size][/center]

[b]GI/PI's name:[/b] {{member_name}}
[b]Activity they have performed:[/b] Orentation
[b]Personal Evaluation:[/b]
{{personal_evaluation}}

[b]Note/feedback:[/b]
{{note_feedback}}

[b]Screenshots:[/b]
{{screenshots}}
[i]Make sure to toggle every chat setting and send atleast 1 screenshot with /time.[/i]$$
  ),
  (
    'supervision',
    'supervision_practical',
    $$[center][size=120][b]SUPERVISION LOG — PRACTICAL[/b][/size][/center]

[b]GI/PI's name:[/b] {{member_name}}
[b]Activity they have performed:[/b] Practical
[b]Personal Evaluation:[/b]
{{personal_evaluation}}

[b]Note/feedback:[/b]
{{note_feedback}}

[b]Screenshots:[/b]
{{screenshots}}
[i]Make sure to toggle every chat setting and send atleast 1 screenshot with /time.[/i]$$
  ),
  (
    'supervision',
    'supervision_reinst_exam',
    $$[center][size=120][b]SUPERVISION LOG — REINST. EXAM[/b][/size][/center]

[b]GI/PI's name:[/b] {{member_name}}
[b]Activity they have performed:[/b] Reinst. Exam/exam
[b]Personal Evaluation:[/b]
{{personal_evaluation}}

[b]Note/feedback:[/b]
{{note_feedback}}

[b]Screenshots:[/b]
{{screenshots}}
[i]Make sure to toggle every chat setting and send atleast 1 screenshot with /time.[/i]$$
  )
ON CONFLICT (template_group, status) DO NOTHING;

ALTER TABLE public.log_markdowns
  DROP CONSTRAINT IF EXISTS log_markdowns_process_type_check;

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
      'lr_interview',
      'supervision',
      'supervision_interview',
      'supervision_orentation',
      'supervision_practical',
      'supervision_reinst_exam'
    )
  );

INSERT INTO public.log_markdowns (process_type, content)
VALUES
  (
    'supervision',
    'GI/PI''s name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)'
  ),
  (
    'supervision_interview',
    'GI/PI''s name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)'
  ),
  (
    'supervision_orentation',
    'GI/PI''s name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)'
  ),
  (
    'supervision_practical',
    'GI/PI''s name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)'
  ),
  (
    'supervision_reinst_exam',
    'GI/PI''s name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)'
  )
ON CONFLICT (process_type) DO NOTHING;
