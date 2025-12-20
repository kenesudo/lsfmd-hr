CREATE TABLE IF NOT EXISTS public.reinstatement_bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('on_hold', 'pending_recommendations', 'pending_exam', 'pending_badge', 'exam_failed', 'denied')),
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reinstatement_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('on_hold', 'pending_recommendations', 'pending_exam', 'pending_badge', 'exam_failed', 'denied')),
  applicant_name TEXT NOT NULL,
  hr_rank TEXT NOT NULL,
  hr_name TEXT NOT NULL,
  reasons TEXT,
  generated_bbc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reinstatement_bbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reinstatement_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY reinstatement_bbc_templates_read
  ON public.reinstatement_bbc_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY reinstatement_bbc_templates_admin_write
  ON public.reinstatement_bbc_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

CREATE POLICY reinstatement_activities_read_own
  ON public.reinstatement_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY reinstatement_activities_insert_own
  ON public.reinstatement_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reinstatement_activities_admin_read
  ON public.reinstatement_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

CREATE TRIGGER reinstatement_bbc_templates_updated_at
  BEFORE UPDATE ON public.reinstatement_bbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO public.reinstatement_bbc_templates (status, template_code)
VALUES
(
  'on_hold',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#FFD700]On-Hold[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

We have reviewed your reinstatement request thoroughly and with consideration, and have unfortunately found some errors. Therefore, your reinstatement will be set to [b][color=#FFD700]ON-HOLD[/color][/b] for the following reasons:  

[b][color=#FFD700]
{{reasons}}
[/color][/b]  

Failure to fix the listed errors above within 48 hours will lead to the [b][color=#FF0000]DENIAL[/color][/b] of your reinstatement. We wish you nothing but luck with the rest of your recruitment process.  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]
[/COLOR][/LEFT][/INDENT]
[/TD]
[/TR]
[/TABLE]

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]
[/TD]
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
  'pending_recommendations',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=pink]Pending[/color] [color=#FFFFFF]Recommendations[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

Your reinstatement has been thoroughly reviewed and forwarded to the [b][color=#FFFFFF]Reinstatement Committee[/color][/b]. Please be patient as the committee members [b][color=#00FF00]cast their votes[/color][/b] on your application.  

To move forward in the reinstatement process, you need to secure a minimum of [b]12 points[/b]. The voting points are allocated as follows:  

[LIST] [*] H.R Supervisory: [b][color=#00FF00]3 points each[/color][/b]  [*] High Command Staff (R4+): [b][color=#00FF00]2 points each[/color][/b]  [/LIST]

We wish you nothing but luck with the rest of your recruitment process.  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]
[/COLOR][/LEFT][/INDENT]
[/TD]
[/TR]
[/TABLE]

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]
[/TD]
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
  'pending_exam',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#99ff99]Pending Reinstatement Exam[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

You have successfully gathered the sufficient amount of votes from the [b]Reinstatement Committee[/b]. Your reinstatement is now set to [b][color=#99ff99]Pending Exam[/color][/b].  

[CENTER]  
[b][color="#ADD8E6"]It is highly recommended that you take a look at the attached components below.[/color][/b]  
[QUOTE]  
[URL="https://forums.hzgaming.net/showthread.php/577476-LSFMD-Official-Handbook"]LSFMD - Handbook[/URL] ▐ ▌ [URL="https://forums.hzgaming.net/showthread.php/300088-LSFMD-Mission-Statement-and-Priorities"]Mission Statement and Priorities[/URL]  
[/QUOTE]  
[/CENTER]  

You currently have [b]72 hours[/b] to take your [b]Reinstatement Exam[/b]. You may head over to our station located near Los Santos International Airport and contact a [URL="https://forums.hzgaming.net/showthread.php/587494-LSFMD-Human-Resources-Personnel-Roster"]Human Resources Personnel[/URL] for your exam.  

Failure to take the exam in the given time will result in the [b][color=#FF0000]denial[/color][/b] of your reinstatement.  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]  
[/COLOR][/LEFT][/INDENT]
[/TD]  
[/TR]  
[/TABLE]  

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]  
[/TD]  
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
  'pending_badge',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#00B6BF]Pending Badge[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

Your application has been validated by [b]Executive Staff (R5+)[/b]. We are pleased to announce that you are now [b][color=#00B6BF]Pending Badge[/color][/b].  

[CENTER]  
[b][color="#ADD8E6"]It is highly recommended that you take a look at the attached components below.[/color][/b]  
[QUOTE]  
[URL="https://forums.hzgaming.net/showthread.php/501248-LSFMD-Official-Handbook"]LSFMD - Handbook[/URL] ▐ ▌ [URL="https://forums.hzgaming.net/showthread.php/300088"]Mission Statement and Priorities[/URL]  
[/QUOTE]  
[/CENTER]  

You may contact any [URL="https://forums.hzgaming.net/showthread.php/587494-LSFMD-Human-Resources-Personnel-Roster"]Human Resources Personnel[/URL] to receive your badge.  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]  
[/COLOR][/LEFT][/INDENT]
[/TD]  
[/TR]  
[/TABLE]  

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]  
[/TD]  
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
  'exam_failed',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width:890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#FF0000]Exam Failed[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

We regret to inform you that you have [b][color=#FF0000]failed your reinstatement exam[/color][/b]. You will not be able to reapply for [b]three (3) days[/b] following this denial.  

[b][color=#FF0000]Reasons:[/color][/b]  
{{reasons}}

Feel free to apply again once three days have passed. Attempting to re-apply before the end of the given duration will result in a [b][color=#FF0000]temporary blacklist[/color][/b].  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]  
[/COLOR][/LEFT][/INDENT]
[/TD]  
[/TR]  
[/TABLE]  

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]  
[/TD]  
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
  'denied',
  $$[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.ibb.co/B2B1yNFX/hr-heading-2.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#FF0000]Denied[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear Applicant,  

After a captivating effort reviewing your reinstatement request, we regret to inform you that your application has been [b][color=#FF0000]DENIED[/color][/b]. You will not be able to reapply for [b]three (3) days[/b] following this denial.  

[b][color=#FF0000]Reasons:[/color][/b]  
{{reasons}}

Feel free to apply again after three days have passed. Attempting to re-apply before the end of the given duration will result in a [b][color=#FF0000]temporary blacklist[/color][/b].  

Respectfully,  
[b][color="orange"]{{hr_rank}} & {{hr_name}}[/color][/b]  
[color="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/color]  

[/SIZE]  
[/COLOR][/LEFT][/INDENT]
[/TD]  
[/TR]  
[/TABLE]  

[CENTER][COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
[URL="https://forums.hzgaming.net/forumdisplay.php/48"]www.lsfmd.gov[/URL]  
[URL="https://discord.gg/horizon-gaming-factions-466211230881939457"]Discord[/URL][/CENTER]  
[/TD]  
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
