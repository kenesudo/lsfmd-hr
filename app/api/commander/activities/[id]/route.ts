'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
  status?: 'accepted' | 'denied';
  denyReason?: string | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  const { admin, userId } = authResult;

  const { id } = await context.params;
  const activityId =
    id || (() => {
      const url = new URL(request.url);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || null;
    })();

  if (!activityId) {
    return NextResponse.json({ ok: false, error: 'Missing activity id.' }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const nextStatus = body.status;
  if (!nextStatus || !['accepted', 'denied'].includes(nextStatus)) {
    return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
  }

  const denyReason = (body.denyReason ?? null)?.toString().trim() || null;

  const updates: Record<string, unknown> = {
    status: nextStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId,
    deny_reason: nextStatus === 'denied' ? denyReason : null,
  };

  const { data, error } = await admin
    .from('hr_activities')
    .update(updates)
    .eq('id', activityId)
    .select('id, status, reviewed_at, reviewed_by, deny_reason')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: 'Activity not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, activity: data });
}
