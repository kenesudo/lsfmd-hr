-- Migration 004: Refactor member type system with historical salary tracking
-- This ensures salary is captured at activity submission time, not retroactively calculated

-- Drop the member_earnings view (no longer needed)
DROP VIEW IF EXISTS member_earnings;

-- Create member_types table
CREATE TABLE IF NOT EXISTS public.member_types (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create member_salary_rates table for configurable salary rates
CREATE TABLE IF NOT EXISTS public.member_salary_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_type_key TEXT NOT NULL REFERENCES public.member_types(key) ON UPDATE CASCADE ON DELETE CASCADE,
  salary_per_point NUMERIC NOT NULL CHECK (salary_per_point >= 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default member types
INSERT INTO public.member_types (key, label) VALUES
  ('part-time', 'Part-time'),
  ('full-time', 'Full-time')
ON CONFLICT (key) DO NOTHING;

-- Insert default salary rates
INSERT INTO public.member_salary_rates (member_type_key, salary_per_point) VALUES
  ('part-time', 350),
  ('full-time', 750)
ON CONFLICT DO NOTHING;

-- Update profiles table to use FK to member_types
-- First, ensure all existing member_type values are valid
UPDATE public.profiles 
SET member_type = 'part-time' 
WHERE member_type IS NULL OR member_type NOT IN ('part-time', 'full-time');

-- Add foreign key constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_member_type_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_member_type_fkey 
FOREIGN KEY (member_type) 
REFERENCES public.member_types(key) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_member_salary_rates_member_type ON public.member_salary_rates(member_type_key);
CREATE INDEX IF NOT EXISTS idx_member_salary_rates_effective_from ON public.member_salary_rates(effective_from DESC);

-- Enable RLS on new tables
ALTER TABLE public.member_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_salary_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies: Everyone can read member types and rates
CREATE POLICY "Anyone can view member types"
  ON public.member_types FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view salary rates"
  ON public.member_salary_rates FOR SELECT
  USING (true);

-- Only commanders can manage member types and rates
CREATE POLICY "Commanders can manage member types"
  ON public.member_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

CREATE POLICY "Commanders can manage salary rates"
  ON public.member_salary_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hr_rank IN ('Commander', 'Assistant Commander')
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_types_updated_at
  BEFORE UPDATE ON public.member_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_salary_rates_updated_at
  BEFORE UPDATE ON public.member_salary_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get current salary rate for a member type
CREATE OR REPLACE FUNCTION get_current_salary_rate(p_member_type_key TEXT)
RETURNS NUMERIC AS $$
  SELECT salary_per_point
  FROM public.member_salary_rates
  WHERE member_type_key = p_member_type_key
  ORDER BY effective_from DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
