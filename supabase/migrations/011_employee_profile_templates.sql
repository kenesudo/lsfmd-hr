-- Employee Profile BBC Templates (Creation)
CREATE TABLE IF NOT EXISTS public.employee_profile_bbc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('creation')),
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Profile Activities (Creation)
CREATE TABLE IF NOT EXISTS public.employee_profile_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department_rank TEXT NOT NULL,
  badge_number TEXT NOT NULL,
  division_assignment TEXT NOT NULL,
  date_of_employment TEXT NOT NULL,
  application_link TEXT NOT NULL,
  awards TEXT,
  ribbon_rack TEXT,
  disciplinary_record TEXT,
  previous_name TEXT,
  discord TEXT NOT NULL,
  timezone TEXT NOT NULL,
  country_of_residence TEXT NOT NULL,
  generated_bbc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Profile Update Log Templates
CREATE TABLE IF NOT EXISTS public.employee_profile_update_log_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('update')),
  template_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Profile Update Activities
CREATE TABLE IF NOT EXISTS public.employee_profile_update_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_information TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  additional_information TEXT,
  generated_bbc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_profile_bbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profile_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profile_update_log_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profile_update_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_profile_bbc_templates
CREATE POLICY employee_profile_bbc_templates_read
  ON public.employee_profile_bbc_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY employee_profile_bbc_templates_admin_write
  ON public.employee_profile_bbc_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- RLS Policies for employee_profile_activities
CREATE POLICY employee_profile_activities_read_own
  ON public.employee_profile_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY employee_profile_activities_insert_own
  ON public.employee_profile_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY employee_profile_activities_admin_read
  ON public.employee_profile_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- RLS Policies for employee_profile_update_log_templates
CREATE POLICY employee_profile_update_log_templates_read
  ON public.employee_profile_update_log_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY employee_profile_update_log_templates_admin_write
  ON public.employee_profile_update_log_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- RLS Policies for employee_profile_update_activities
CREATE POLICY employee_profile_update_activities_read_own
  ON public.employee_profile_update_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY employee_profile_update_activities_insert_own
  ON public.employee_profile_update_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY employee_profile_update_activities_admin_read
  ON public.employee_profile_update_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- Triggers for updated_at
CREATE TRIGGER employee_profile_bbc_templates_updated_at
  BEFORE UPDATE ON public.employee_profile_bbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER employee_profile_update_log_templates_updated_at
  BEFORE UPDATE ON public.employee_profile_update_log_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Seed Employee Profile Creation Template
INSERT INTO public.employee_profile_bbc_templates (status, template_code)
VALUES (
  'creation',
  $$[TABLE="width: 902, align: center"]
[TR="bgcolor: #B91C1C"]
[TD][TABLE="class: grid, width: 900, align: center"]
[TR="bgcolor: #000000"]
[TD][TABLE="width: 880, align: center"]
[TR]
[TD="width: 200, align: left"]
[/TD]
[/TR]
[TR]
[TD][IMG]https://i.imgur.com/FaXBodC.png[/IMG][/TD]
[TD="align: right"][SIZE=5][COLOR=#FFFFFF][B][FONT=Arial Black]LOS SANTOS FIRE & MEDICAL DEPARTMENT[/FONT][/B][/COLOR][/SIZE]
[FONT=Century Gothic][SIZE=3][I][COLOR=#FF0000]Bravery, Honor, Service[/COLOR][/I][/SIZE][/FONT]
[SIZE=3][I][COLOR=#E5E7EB]Employee Profile[/COLOR][/I][/SIZE][/TD]
[/TR]
[TR]
[/TR]
[/TABLE]
[/TD]
[/TR]
[TR="bgcolor: #B91C1C"]
[TD][LEFT][B][COLOR=#FFFFFF]1. EMPLOYEE PROFILE[/COLOR][/B][/LEFT]
[/TD]
[/TR]
[TR="bgcolor: #000000"]
[TD][CENTER]
[TABLE="class: outer_border, width: 850, align: center"]
[TR]
[TD="bgcolor: #000000, align: left"][COLOR=#FFFFFF]
[TABLE="width: 820, align: center"]
[TR]
[TD="width: 400"][B]Employee Name:[/B][INDENT][I]{{employee_name}}[/I][/INDENT]
 
[B]Department Rank:[/B][INDENT][I]{{department_rank}}[/I][/INDENT]

[B]Badge Number:[/B][INDENT][I]{{badge_number}}[/I][/INDENT]
 
[B]Division / Assignment:[/B][INDENT][I]{{division_assignment}}[/I][/INDENT]
[/TD]
[TD="width: 20"][/TD]
[TD="width: 400"][B]Date of Employment:[/B][INDENT][I]{{date_of_employment}}[/I][/INDENT]
 
[B]Application Link:[/B][INDENT][I]{{application_link}}[/I][/INDENT]
[/TD]
[/TR]
[/TABLE]
[/COLOR][/TD]
[/TR]
[/TABLE]
[/CENTER]
[/TD]
[/TR]
[TR="bgcolor: #B91C1C"]
[TD][LEFT][B][COLOR=#FFFFFF]2. AWARDS & RIBBONS[/COLOR][/B][/LEFT]
[/TD]
[/TR]
[TR="bgcolor: #000000"]
[TD][CENTER]
[TABLE="class: outer_border, width: 850, align: center"]
[TR]
[TD="bgcolor: #000000, align: left"][COLOR=#FFFFFF]
 
[B]Awards:[/B][INDENT]{{awards}}[/INDENT]
 
[B]Ribbon Rack:[/B]
[CENTER]{{ribbon_rack}}[/CENTER]
 
[/COLOR][/TD]
[/TR]
[/TABLE]
[/CENTER]
[/TD]
[/TR]
[TR="bgcolor: #B91C1C"]
[TD][LEFT][B][COLOR=#FFFFFF]3. DISCIPLINARY RECORD[/COLOR][/B][/LEFT]
[/TD]
[/TR]
[TR="bgcolor: #000000"]
[TD][CENTER]
[TABLE="class: outer_border, width: 850, align: center"]
[TR]
[TD="bgcolor: #000000, align: left"][COLOR=#FFFFFF]
{{disciplinary_record}}
[/COLOR][/TD]
[/TR]
[/TABLE]
[/CENTER]
[/TD]
[/TR]
[TR="bgcolor: #B91C1C"]
[TD][LEFT][B][COLOR=#FFFFFF]4. ADDITIONAL INFORMATION ((OOC))[/COLOR][/B][/LEFT]
[/TD]
[/TR]
[TR="bgcolor: #000000"]
[TD][CENTER]
[TABLE="class: outer_border, width: 850, align: center"]
[TR]
[TD="bgcolor: #000000, align: left"][COLOR=#FFFFFF]
[TABLE="width: 820, align: center"]
[TR]
[TD="width: 400"][B]Previous Name:[/B][INDENT][I]{{previous_name}}[/I][/INDENT]
 
[B]Discord:[/B][INDENT][I]{{discord}}[/I][/INDENT]
[/TD]
[TD="width: 20"][/TD]
[TD="width: 400"][B]Timezone:[/B][INDENT][I]{{timezone}}[/I][/INDENT]
 
[B]Country of Residence:[/B][INDENT][I]{{country_of_residence}}[/I][/INDENT]
[/TD]
[/TR]
[/TABLE]
[/COLOR][/TD]
[/TR]
[/TABLE]
[/CENTER]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]$$
);

-- Seed Employee Profile Update Log Template
INSERT INTO public.employee_profile_update_log_templates (status, template_code)
VALUES (
  'update',
  $$[TABLE="width: 902, align: center"]
[TR="bgcolor: #B91C1C"]
[TD][TABLE="class: grid, width: 900, align: center"]
[TR="bgcolor: #000000"]
[TD][TABLE="width: 880, align: center"]
[TR]
[TD="width: 200, align: left"][FONT=Century Gothic][I][SIZE=1][COLOR="#FFC0CB"]{{hr_name}}[/COLOR]
[COLOR="#FFFFFF"]52nd Administration,
San Andreas,
Los Santos,
LSFMD Headquarters[/COLOR][/SIZE][/I][/FONT]
[/TD]
[/TR]
[TR]
[TD][IMG]https://i.imgur.com/FaXBodC.png[/IMG][/TD]
[TD="align: right"][SIZE=5][COLOR=#FFFFFF][B][FONT=Arial Black]LOS SANTOS FIRE & MEDICAL DEPARTMENT[/FONT][/B][/COLOR][/SIZE]
[FONT=Century Gothic][SIZE=3][I][COLOR=#FF0000]Bravery, Honor, Service[/COLOR][/I][/SIZE][/FONT]
[SIZE=3][I][COLOR=#E5E7EB]Employee Profile[/COLOR][/I][/SIZE][/TD]
[/TR]
[TR]
[/TR]
[/TABLE]
[/TD]
[/TR]
[TR="bgcolor: #B91C1C"]
[TD][LEFT][B][COLOR=#FFFFFF]1. EMPLOYEE PROFILE UPDATE[/COLOR][/B][/LEFT]
[/TD]
[/TR]
[TR="bgcolor: #000000"]
[TD]
[TABLE="class: outer_border, width: 850, align: center"]
[TR]
[TD="bgcolor: #000000, align: left"][COLOR=#FFFFFF]
[TABLE="width: 820, align: center"]
[TR]
[TD="width: 400"]
 
[B]Updated Information:[/B][INDENT][I]{{updated_information}}[/I][/INDENT]

[B]Approved by:[/B][INDENT][I]{{approved_by}}[/I][/INDENT]
 
[B]Additional Information:[/B][INDENT][I]{{additional_information}}[/I][/INDENT]
[/TD]
[/TR]
[/TABLE][/COLOR][TABLE="width: 820, align: center"][/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]
[/TD]
[/TR]
[/TABLE]$$
);
