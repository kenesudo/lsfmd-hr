'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

const parseMonth = (value: string | null): { start: Date; end: Date; label: string } => {
  const now = new Date();
  const fallbackStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const fallbackEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const fallbackLabel = `${fallbackStart.getUTCFullYear()}-${String(fallbackStart.getUTCMonth() + 1).padStart(2, '0')}`;

  if (!value) {
    return { start: fallbackStart, end: fallbackEnd, label: fallbackLabel };
  }

  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return { start: fallbackStart, end: fallbackEnd, label: fallbackLabel };
  }

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start, end, label: `${year}-${String(month + 1).padStart(2, '0')}` };
};

type ScoreRow = { key: string; score: number };
type ActivityRow = {
  id: string;
  hr_id: string;
  activity_type: string;
  created_at: string;
  status: string;
};
type ProfileRow = {
  id: string;
  full_name: string;
  username: string;
  hr_rank: string;
};

export async function GET(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const { start, end, label } = parseMonth(monthParam);

  const [{ data: typeRows, error: typeErr }, { data: activityRows, error: activitiesErr }] = await Promise.all([
    admin.from('hr_activities_type').select('key, score'),
    admin
      .from('hr_activities')
      .select('id, hr_id, activity_type, created_at, status')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
  ]);

  if (typeErr || activitiesErr) {
    return NextResponse.json(
      { ok: false, error: typeErr?.message || activitiesErr?.message || 'Failed to load scores' },
      { status: 500 },
    );
  }

  const scoreMap = new Map<string, number>((typeRows ?? []).map((row: ScoreRow) => [row.key, Number(row.score) || 0]));
  const rows = (activityRows ?? []) as ActivityRow[];
  const hrIds = Array.from(new Set(rows.map((row) => row.hr_id)));

  let profilesById = new Map<string, ProfileRow>();
  if (hrIds.length > 0) {
    const { data: profiles, error: profilesErr } = await admin
      .from('profiles')
      .select('id, full_name, username, hr_rank')
      .in('id', hrIds);
    if (profilesErr) {
      return NextResponse.json({ ok: false, error: profilesErr.message }, { status: 500 });
    }
    profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  }

  const acceptedRows = rows.filter((row) => row.status === 'accepted');
  const scoreboard = acceptedRows.reduce<Record<string, { score: number; count: number }>>((acc, row) => {
    const points = scoreMap.get(row.activity_type) ?? 0;
    if (!acc[row.hr_id]) {
      acc[row.hr_id] = { score: 0, count: 0 };
    }
    acc[row.hr_id].score += points;
    acc[row.hr_id].count += 1;
    return acc;
  }, {});

  const leaderboard = Object.entries(scoreboard)
    .map(([hrId, info]) => ({
      hr_id: hrId,
      score: info.score,
      activity_count: info.count,
      profile: profilesById.get(hrId) ?? null,
    }))
    .sort((a, b) => b.score - a.score || b.activity_count - a.activity_count);

  const activities = rows.map((row) => ({
    ...row,
    score: row.status === 'accepted' ? scoreMap.get(row.activity_type) ?? 0 : 0,
    profile: profilesById.get(row.hr_id) ?? null,
  }));

  return NextResponse.json({
    ok: true,
    month: label,
    start: start.toISOString(),
    end: end.toISOString(),
    leaderboard,
    activities,
  });
}
