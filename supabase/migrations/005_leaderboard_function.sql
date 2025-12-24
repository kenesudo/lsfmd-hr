-- Migration 005: Add leaderboard function for dashboard

CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INT DEFAULT 10)
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
$$ LANGUAGE plpgsql STABLE;
