-- Add member_type to profiles (part-time or full-time)
ALTER TABLE public.profiles
  ADD COLUMN member_type TEXT NOT NULL DEFAULT 'part-time' CHECK (member_type IN ('part-time', 'full-time'));

-- Add salary field to hr_activities
ALTER TABLE public.hr_activities
  ADD COLUMN salary NUMERIC(10, 2);

-- Create a view for salary calculations
CREATE OR REPLACE VIEW public.member_earnings AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.member_type,
  CASE 
    WHEN p.member_type = 'part-time' THEN 350
    WHEN p.member_type = 'full-time' THEN 750
    ELSE 0
  END as base_salary_per_point,
  COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN hat.score ELSE 0 END), 0) as total_points,
  COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN ha.salary ELSE 0 END), 0) as total_activity_salary,
  CASE 
    WHEN p.member_type = 'part-time' THEN 350 * COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN hat.score ELSE 0 END), 0)
    WHEN p.member_type = 'full-time' THEN 750 * COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN hat.score ELSE 0 END), 0)
    ELSE 0
  END as total_score_earnings,
  CASE 
    WHEN p.member_type = 'part-time' THEN 350 * COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN hat.score ELSE 0 END), 0) + COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN ha.salary ELSE 0 END), 0)
    WHEN p.member_type = 'full-time' THEN 750 * COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN hat.score ELSE 0 END), 0) + COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN ha.salary ELSE 0 END), 0)
    ELSE COALESCE(SUM(CASE WHEN ha.status = 'accepted' THEN ha.salary ELSE 0 END), 0)
  END as total_earnings
FROM public.profiles p
LEFT JOIN public.hr_activities ha ON ha.hr_id = p.id
LEFT JOIN public.hr_activities_type hat ON hat.key = ha.activity_type
GROUP BY p.id, p.username, p.full_name, p.member_type;

-- Grant access to the view
ALTER VIEW public.member_earnings OWNER TO postgres;

-- RLS policies for the view
ALTER TABLE public.member_earnings SET (security_invoker = true);
