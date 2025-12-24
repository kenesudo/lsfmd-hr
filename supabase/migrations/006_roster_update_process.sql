-- Add 'roster_update' process group to hr_activities_type table
-- This allows roster updates to be tracked as activities

-- First, update the CHECK constraint to include the new process group
ALTER TABLE public.hr_activities_type
  DROP CONSTRAINT IF EXISTS hr_activities_type_process_group_check;

ALTER TABLE public.hr_activities_type
  ADD CONSTRAINT hr_activities_type_process_group_check
  CHECK (process_group IN ('application', 'reinstatement', 'supervision', 'trainings', 'employee_profile', 'roster_update'));

-- Insert the roster_update activity type
INSERT INTO public.hr_activities_type (key, process_group, label, score)
VALUES ('roster_update', 'roster_update', 'Roster Update', 1)
ON CONFLICT (key) DO NOTHING;
