-- Migration 007: Add monthly leaderboard and filtering functions

-- Drop existing function and recreate with month parameter
DROP FUNCTION IF EXISTS get_leaderboard(INT);

-- Monthly leaderboard function (top 3 for dashboard)
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(
  target_year INT,
  target_month INT,
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  hr_id UUID,
  full_name TEXT,
  username TEXT,
  hr_rank TEXT,
  total_salary NUMERIC,
  total_points INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS hr_id,
    p.full_name,
    p.username,
    p.hr_rank,
    COALESCE(SUM(a.salary), 0) AS total_salary,
    COALESCE(SUM(t.score), 0)::INT AS total_points
  FROM public.profiles p
  LEFT JOIN public.hr_activities a ON a.hr_id = p.id 
    AND a.status = 'accepted'
    AND EXTRACT(YEAR FROM a.created_at) = target_year
    AND EXTRACT(MONTH FROM a.created_at) = target_month
  LEFT JOIN public.hr_activities_type t ON t.key = a.activity_type
  GROUP BY p.id, p.full_name, p.username, p.hr_rank
  HAVING COALESCE(SUM(a.salary), 0) > 0
  ORDER BY total_salary DESC, total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_monthly_leaderboard(INT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard(INT, INT, INT) TO authenticated;

-- Overall leaderboard function (all time)
CREATE OR REPLACE FUNCTION get_overall_leaderboard(limit_count INT DEFAULT 10)
RETURNS TABLE (
  hr_id UUID,
  full_name TEXT,
  username TEXT,
  hr_rank TEXT,
  total_salary NUMERIC,
  total_points INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS hr_id,
    p.full_name,
    p.username,
    p.hr_rank,
    COALESCE(SUM(a.salary), 0) AS total_salary,
    COALESCE(SUM(t.score), 0)::INT AS total_points
  FROM public.profiles p
  LEFT JOIN public.hr_activities a ON a.hr_id = p.id AND a.status = 'accepted'
  LEFT JOIN public.hr_activities_type t ON t.key = a.activity_type
  GROUP BY p.id, p.full_name, p.username, p.hr_rank
  ORDER BY total_salary DESC, total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_overall_leaderboard(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_overall_leaderboard(INT) TO authenticated;
