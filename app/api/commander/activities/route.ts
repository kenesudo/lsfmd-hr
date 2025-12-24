'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

type ActivityRow = {
  id: string;
  hr_id: string;
  bbc_content: string;
  activity_type: string;
  status: 'pending' | 'accepted' | 'denied';
  salary: number | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  deny_reason: string | null;
};

type ProfileLite = {
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

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || 'all').toLowerCase();
  const q = (url.searchParams.get('q') || '').trim();
  const hrId = (url.searchParams.get('hrId') || '').trim();
  const activityType = (url.searchParams.get('activityType') || '').trim();

  let hrIdsFilter: string[] | null = null;
  if (q) {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(200);

    if (profilesError) {
      return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
    }

    hrIdsFilter = (profiles ?? []).map((p) => p.id);
    if (hrIdsFilter.length === 0) {
      return NextResponse.json({ ok: true, activities: [] });
    }
  }

  let query = admin
    .from('hr_activities')
    .select('id, hr_id, bbc_content, activity_type, status, salary, created_at, reviewed_at, reviewed_by, deny_reason')
    .order('created_at', { ascending: false })
    .limit(500);

  if (status !== 'all') {
    if (!['pending', 'accepted', 'denied'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status filter.' }, { status: 400 });
    }
    query = query.eq('status', status);
  }

  if (hrId) {
    query = query.eq('hr_id', hrId);
  }

  if (activityType) {
    query = query.eq('activity_type', activityType);
  }

  if (hrIdsFilter) {
    query = query.in('hr_id', hrIdsFilter);
  }

  const { data: activities, error: activitiesError } = await query;

  if (activitiesError) {
    return NextResponse.json({ ok: false, error: activitiesError.message }, { status: 500 });
  }

  const rows = (activities ?? []) as ActivityRow[];
  const hrIds = Array.from(new Set(rows.map((r) => r.hr_id)));
  const reviewerIds = Array.from(new Set(rows.map((r) => r.reviewed_by).filter(Boolean) as string[]));
  const allProfileIds = Array.from(new Set([...hrIds, ...reviewerIds]));

  const profilesById = new Map<string, ProfileLite>();
  if (allProfileIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, username, hr_rank')
      .in('id', allProfileIds);

    if (profilesError) {
      return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
    }

    (profiles ?? []).forEach((p) => profilesById.set(p.id, p as ProfileLite));
  }

  const enriched = rows.map((row) => {
    const hrProfile = profilesById.get(row.hr_id) ?? null;
    const reviewerProfile = row.reviewed_by ? profilesById.get(row.reviewed_by) ?? null : null;

    return {
      ...row,
      hr: hrProfile,
      reviewer: reviewerProfile,
    };
  });

  return NextResponse.json({ ok: true, activities: enriched });
}
