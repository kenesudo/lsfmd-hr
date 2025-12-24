'use server';

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

export async function GET(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const templatesPromise = supabase.from('bbc_templates').select('*', { count: 'exact', head: true });
  const pendingPromise = supabase
    .from('hr_activities')
    .select('*', { count: 'exact', head: true })
    .eq('hr_id', user.id)
    .eq('status', 'pending');
  const completedPromise = supabase
    .from('hr_activities')
    .select('*', { count: 'exact', head: true })
    .eq('hr_id', user.id)
    .in('status', ['accepted', 'denied']);
  const totalActivitiesPromise = supabase
    .from('hr_activities')
    .select('*', { count: 'exact', head: true })
    .eq('hr_id', user.id);
  const recentPromise = supabase
    .from('hr_activities')
    .select('id, activity_type, status, created_at')
    .eq('hr_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  const acceptedPromise = supabase
    .from('hr_activities')
    .select('activity_type')
    .eq('hr_id', user.id)
    .eq('status', 'accepted');
  const typeScoresPromise = supabase.from('hr_activities_type').select('key, score, process_group');
  const breakdownPromise = supabase
    .from('hr_activities')
    .select('activity_type')
    .eq('hr_id', user.id);

  const [
    templatesResult,
    pendingResult,
    completedResult,
    totalActivitiesResult,
    recentResult,
    acceptedResult,
    typeScoresResult,
    breakdownResult,
  ] = await Promise.all([
    templatesPromise,
    pendingPromise,
    completedPromise,
    totalActivitiesPromise,
    recentPromise,
    acceptedPromise,
    typeScoresPromise,
    breakdownPromise,
  ]);

  const error =
    templatesResult.error ||
    pendingResult.error ||
    completedResult.error ||
    totalActivitiesResult.error ||
    recentResult.error ||
    acceptedResult.error ||
    typeScoresResult.error ||
    breakdownResult.error;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  type ScoreRow = { key: string; score: number; process_group: string };
  type ActivityTypeRow = { activity_type: string };

  const scoreMap = new Map<string, number>(
    (typeScoresResult.data ?? []).map((row: ScoreRow) => [row.key, Number(row.score) || 0]),
  );

  const processGroupMap = new Map<string, string>(
    (typeScoresResult.data ?? []).map((row: ScoreRow) => [row.key, row.process_group]),
  );

  const totalScore = (acceptedResult.data ?? []).reduce((sum: number, row: ActivityTypeRow) => {
    const score = scoreMap.get(row.activity_type) ?? 0;
    return sum + score;
  }, 0);

  const processGroupCounts = (breakdownResult.data ?? []).reduce<Record<string, number>>((acc, row: ActivityTypeRow) => {
    const processGroup = processGroupMap.get(row.activity_type) ?? 'other';
    acc[processGroup] = (acc[processGroup] ?? 0) + 1;
    return acc;
  }, {});

  const breakdown = Object.entries(processGroupCounts).map(([processGroup, count]) => ({
    process_group: processGroup,
    count,
  }));

  // Calculate total salary from accepted activities
  const { data: activitiesWithSalary } = await supabase
    .from('hr_activities')
    .select('salary')
    .eq('hr_id', user.id)
    .eq('status', 'accepted');

  const totalSalary = (activitiesWithSalary ?? []).reduce((sum, act) => sum + (Number(act.salary) || 0), 0);

  return NextResponse.json({
    ok: true,
    total_templates: templatesResult.count ?? 0,
    pending_reviews: pendingResult.count ?? 0,
    completed_reviews: completedResult.count ?? 0,
    total_activities: totalActivitiesResult.count ?? 0,
    total_score: totalScore,
    total_salary: totalSalary,
    activity_breakdown: breakdown,
    recent_activities: recentResult.data ?? [],
  });
}
