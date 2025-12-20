CREATE TABLE IF NOT EXISTS public.trainings_bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('creation', 'training', 'exam', 'close', 'reopen')),
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainings_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('creation', 'training', 'exam', 'close', 'reopen')),
  member_name TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_bbc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trainings_bbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY trainings_bbc_templates_read
  ON public.trainings_bbc_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY trainings_bbc_templates_admin_write
  ON public.trainings_bbc_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

CREATE POLICY trainings_activities_read_own
  ON public.trainings_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY trainings_activities_insert_own
  ON public.trainings_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY trainings_activities_admin_read
  ON public.trainings_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

CREATE TRIGGER trainings_bbc_templates_updated_at
  BEFORE UPDATE ON public.trainings_bbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO public.trainings_bbc_templates (status, template_code)
VALUES
(
  'creation',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="class: grid, width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.imgur.com/BNLiU7L.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD]
[CENTER]
[SIZE=4][B][COLOR=orange]{{member_name}}[/COLOR][/B][/SIZE]
[/TD]
[/TR]
[TR]
[TD]
[B][CENTER][SIZE=3][COLOR=white]RECRUITED Via: [COLOR=orange]{{recruited_via}}[/COLOR][/COLOR][/SIZE][/center][/b]
[/TD]
[/TR]
[TR][TD]
[CENTER][COLOR=white][B][size=3]Discord:[/size][/B][/COLOR] [size=3][COLOR=orange]{{discord}}[/COLOR][/size][/CENTER]
[/TD]
[/TR]

[TR]
[TD]
[CENTER][COLOR=white][B][SIZE=3]Forum Account Link: [/SIZE][/B][/COLOR][size=3][URL={{forum_link}}][COLOR=orange]ATTACHMENT[/COLOR][/URL][/SIZE]
[/CENTER]
[/TD]
[/TR]
[/CENTER]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
$$
),
(
  'training',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.imgur.com/ZYR8S4c.png[/img][/CENTER][/TD]
[/TR]



[TR]
[TD][CENTER][SIZE=4][B][COLOR=white]TRAINING COMPLETION: [COLOR=orange]{{training_completion}}[/COLOR][/COLOR][/B][/SIZE][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][COLOR=white][B]Instructor and supervisor, if any:[/B][/COLOR] [COLOR=orange]{{instructor}}[/COLOR][/CENTER][/TD]
[/TR]

[/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
$$
),
(
  'exam',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.imgur.com/ZYR8S4c.png[/img][/CENTER][/TD]
[/TR]



[TR]
[TD][CENTER][SIZE=4][B][COLOR=white]EXAM STATUS: [COLOR="#00FF00"]{{exam_passed_label}}[/COLOR] / [COLOR="#FF0000"]{{exam_failed_label}}[/COLOR] {{exam_score}} [/COLOR][/B][/SIZE][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][COLOR=white][B]Instructor and supervisor, if any:[/B][/COLOR] [COLOR=orange]{{instructor}}[/COLOR][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][COLOR=white][B]Comments: (MANDATORY IF FAILED)[/B][/COLOR] [COLOR=orange]{{comments}}[/COLOR][/CENTER][/TD]
[/TR]

[/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
$$
),
(
  'close',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.imgur.com/ZYR8S4c.png[/img][/CENTER][/TD]
[/TR]



[TR]
[TD][CENTER][SIZE=4][B][COLOR=orange]TRAINING FILE [/COLOR][COLOR=red] CLOSED[/COLOR][/B][/SIZE][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][COLOR=white][B]REASON:[/B][/COLOR] [COLOR=orange]{{close_reason}}[/COLOR][/CENTER][/TD]
[/TR]

[/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
$$
);
