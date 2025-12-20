CREATE TABLE IF NOT EXISTS public.application_bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('pending_interview', 'pending_badge', 'hired', 'on_hold', 'closed', 'denied', 'blacklisted')),
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Activity Log table
CREATE TABLE IF NOT EXISTS public.application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending_interview', 'pending_badge', 'hired', 'on_hold', 'closed', 'denied', 'blacklisted')),
  applicant_name TEXT NOT NULL,
  hr_rank TEXT NOT NULL,
  hr_name TEXT NOT NULL,
  reasons TEXT,
  generated_bbc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_bbc_templates_updated_at
  BEFORE UPDATE ON public.application_bbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE public.application_bbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bbc_templates (all authenticated users can read)
CREATE POLICY application_bbc_templates_read
  ON public.application_bbc_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete templates
CREATE POLICY application_bbc_templates_admin_write
  ON public.application_bbc_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- RLS Policies for application_activities (users can read their own)
CREATE POLICY application_activities_read_own
  ON public.application_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own activities
CREATE POLICY application_activities_insert_own
  ON public.application_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all activities
CREATE POLICY application_activities_admin_read
  ON public.application_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- Insert default BBC templates
INSERT INTO public.application_bbc_templates (status, template_code) VALUES
('pending_interview', '[TABLE="width: 900, align: center"]
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
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=pink]Pending Interview[/color][/size][/b][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=2][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER]  
[TABLE="width: 850, align: center" bgcolor="black"]
[TR]
[TD]
[INDENT][LEFT][COLOR="#ffffff"][SIZE=2]
Dear {{applicant_name}},

We are pleased to inform you that your application has been [COLOR="#00FF00"]APPROVED[/COLOR] and you have been scheduled for the next phase of recruitment training. Please report to our training facility located near Los Santos International Airport within [B][COLOR=#00FFFF]3 days[/COLOR][/B] from the date of this notice. 

[LIST] [*]Failure to attend in the given duration of time will result in instant [COLOR="#cc0000"]DENIAL[/COLOR] of your application.[*]Applicants must dress neatly and appropriately for the interview.[*]Applicants may not carry illegal substances or weapons.[/LIST]

[B][COLOR="#ADD8E6"]We highly recommend reviewing the attached resources before attending the interview.[/COLOR][/B]

[QUOTE][CENTER][URL="https://forums.hzgaming.net/showthread.php/577476-LSFMD-Official-Handbook"]LSFMD - Handbook[/URL] ▐ ▌ [URL="https://forums.hzgaming.net/showthread.php/579158-LSFMD-Recruitment-Procedures"]Recruitment Procedures[/URL][/CENTER][/QUOTE]

You may contact any [URL="https://forums.hzgaming.net/showthread.php/587494-LSFMD-Human-Resources-Personnel-Roster"]Human Resources Personnel[/URL] or High-Command ((R4+)) for assistance. We wish you nothing but the best in the recruitment process.

Respectfully,  
[COLOR="orange"]{{hr_rank}} {{hr_name}}[/COLOR]  
[COLOR="#ffffff"]Human Resources Office  
Los Santos Fire & Medical Department, San Andreas[/COLOR]

[/SIZE]
[/COLOR][/LEFT][/INDENT]
[/TD]
[/TR]
[/TABLE]

[COLOR="#999999"]"Serving with Courage, Integrity and Pride"[/COLOR]  
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
[/TABLE]'),

('pending_badge', '[TABLE="width: 900, align: center"]
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
Dear {{applicant_name}},

Congratulations, we are delighted to inform you that you have successfully [B][COLOR=GREEN]PASSED[/COLOR][/B] your Interview and have moved on to the next phase of your recruitment. We benevolently invite you to head over to our station located near [B]Los Santos International Airport[/B] to receive your new badge.

[B][COLOR="#ADD8E6"]Please be noted of the following before receiving your badge: [/COLOR][/B]

[LIST] [*] The applicant must dress neatly and appropriately.[*] The applicant may not carry any illegal substances or weapons.[/LIST]

You may contact any [URL="https://forums.hzgaming.net/showthread.php/587494-LSFMD-Human-Resources-Personnel-Roster"]Human Resources Personnel[/URL] to receive your badge.

Respectfully,  
[COLOR="orange"]{{hr_rank}} {{hr_name}}[/COLOR]  
[COLOR="#ffffff"]Office of Administration  
Los Santos Fire & Medical Department, San Andreas[/COLOR]

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
[/TABLE]'),

('hired', '[TABLE="width: 900, align: center"]
[TR="bgcolor: #7A0D0D"]
[TD]
[TABLE="width: 890, align: center"]
[TR="bgcolor: black"]
[TD]
[TABLE="width: 870, align: center" bgcolor="black"]
[TR]
[TD][CENTER][img]https://i.imgur.com/qY5j0HH.png[/img][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][size=3][/size][/CENTER][/TD]
[/TR]

[TR]
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#00FF00]Hired[/color][/size][/b][/CENTER][/TD]
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
Dear {{applicant_name}},

We are delighted to announce that you have officially completed your education and recruitment phase. We strongly recommend that you review the links attached below, which will help guide you through your journey with us in the [b][color=Pink]Los Santos Fire & Medical Department[/color][/b]. The Human Resources team welcomes you and wishes you the best of luck in your career.

[LIST] [*] (( Please head to [URL="https://hzgaming.net/factiondiscord"]Faction Discord[/URL] and change your nickname to "[Trainee] Your Name" ))  [*] (( Request for Discord roles in the "lsfmd-role-request" channel. ))  [/LIST]

Respectfully,  
[b][color="orange"]{{hr_rank}} {{hr_name}}[/color][/b]  
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
[/TABLE]'),

('on_hold', '[TABLE="width: 900, align: center"]
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
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#DEE000]On-Hold[/color][/size][/b][/CENTER][/TD]
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
Dear {{applicant_name}},

After thoroughly reviewing your application, the Human Resources team has found some errors. Therefore, your application has been placed [b][color=#DEE000]On-Hold[/color][/b]. Please [b]fix[/b] the listed issues below within [b]48 hours[/b]. Failure to do so will result in a [B][COLOR=RED]DENIAL[/COLOR][/B] of your application.

[color="#DEE000"]
{{reasons}}
[/color]

If you have any questions, feel free to contact any [URL="https://forums.hzgaming.net/showthread.php/587494-LSFMD-Human-Resources-Personnel-Roster"]Human Resources Personnel[/URL] for clarification. The Human Resources team thanks you for your interest in the department and wishes you the best of luck with the rest of your recruitment process.

Respectfully,  
[b][color="orange"]{{hr_rank}} {{hr_name}}[/color][/b]  
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
[/TABLE]'),

('closed', '[TABLE="width: 900, align: center"]
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
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#FFFFFF]Closed[/color][/size][/b][/CENTER][/TD]
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
Dear {{applicant_name}},

The Human Resources team would first like to thank you for your interest in the department. However, after thorough consideration and a detailed review of your application, we have unfortunately decided to mark your application as [b][color=#FFFFFF]CLOSED[/color][/b] from the [b][color=Pink]Los Santos Fire & Medical Department[/color][/b] for the following reasons:

[b][color=#FFFFFF]
{{reasons}}
[/color][/b]

Therefore, you will not be able to re-apply before [b]3 days[/b] following the closure of your application. Attempting to re-apply before the end of the given duration will result in being [b][color=#FF0000][url=https://forums.hzgaming.net/showthread.php/626930-LSFMD-Recruitment-Blacklist]BLACKLISTED[/url][/color][/b] temporarily.

Respectfully,  
[b][color="orange"]{{hr_rank}} {{hr_name}}[/color][/b]  
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
[/TABLE]'),

('denied', '[TABLE="width: 900, align: center"]
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
Dear {{applicant_name}},

The Human Resources team would first like to thank you for your interest in the department. However, after thorough consideration and a detailed review of your application, we have unfortunately decided to mark your application as [b][color=#FF0000]DENIED[/color][/b] from the [b][color=Pink]Los Santos Fire & Medical Department[/color][/b] for the following reasons:

[b][color=#FF0000]
{{reasons}}
[/color][/b]

Therefore, you will not be able to submit another application for [b]3 days[/b] following your denial. Attempting to re-apply before the end of the given duration will result in being [b][color=#FF0000][url=https://forums.hzgaming.net/showthread.php/626930-LSFMD-Recruitment-Blacklist]BLACKLISTED[/url][/color][/b] temporarily.

Respectfully,  
[b][color="orange"]{{hr_rank}} {{hr_name}}[/color][/b]  
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
[/TABLE]'),

('blacklisted', '[TABLE="width: 900, align: center"]
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
[TD][CENTER][b][size=5][color=#FFFFFF]Status: [/color][color=#FF0000]Blacklisted[/color][/size][/b][/CENTER][/TD]
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
Dear {{applicant_name}},

The Human Resources team would first like to thank you for your interest in the department. However, after thorough consideration and a detailed review of your application, we have unfortunately decided to mark your application as [b][color=#FF0000]BLACKLISTED[/color][/b] from the [b][color=Pink]Los Santos Fire & Medical Department[/color][/b] for the following reasons:

[b][color=#FF0000]
{{reasons}}
[/color][/b]

Attempting to re-apply before the end of the given duration will result in being [b][color=#FF0000][url=https://forums.hzgaming.net/showthread.php/626930-LSFMD-Recruitment-Blacklist]BLACKLISTED[/url][/color][/b] temporarily.

Respectfully,  
[b][color="orange"]{{hr_rank}} {{hr_name}}[/color][/b]  
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
[/TABLE]');
