'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { HR_ROLES, type HrRole } from '@/lib/roles';
import { generateTempPassword } from '@/lib/tempPassword';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
  hrRank?: HrRole;
  lsfmdRank?: string;
  memberType?: 'part-time' | 'full-time';
  disable?: boolean;
  mustChangePassword?: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { id } = await context.params;
  const userId =
    id || (() => {
      const url = new URL(request.url);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || null;
    })();

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Missing member id.' }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const updates: string[] = [];
  const profileUpdates: Record<string, unknown> = {};
  let tempPassword: string | null = null;

  if (typeof body.hrRank === 'string') {
    if (!(HR_ROLES as readonly string[]).includes(body.hrRank)) {
      return NextResponse.json({ ok: false, error: 'Invalid HR role selection.' }, { status: 400 });
    }
    profileUpdates.hr_rank = body.hrRank;
    updates.push('hr_rank');
  }

  if (typeof body.lsfmdRank === 'string') {
    const validLsfmdRanks = ['Paramedic', 'Senior Paramedic', 'Lead Paramedic', 'Lieutenant', 'Captain', 'Assistant Chief', 'Chief'];
    if (!validLsfmdRanks.includes(body.lsfmdRank)) {
      return NextResponse.json({ ok: false, error: 'Invalid LSFMD rank selection.' }, { status: 400 });
    }
    profileUpdates.lsfmd_rank = body.lsfmdRank;
    updates.push('lsfmd_rank');
  }

  if (typeof body.memberType === 'string') {
    if (!['part-time', 'full-time'].includes(body.memberType)) {
      return NextResponse.json({ ok: false, error: 'Invalid member type selection.' }, { status: 400 });
    }
    profileUpdates.member_type = body.memberType;
    updates.push('member_type');
  }

  if (typeof body.mustChangePassword === 'boolean') {
    if (body.mustChangePassword !== true) {
      return NextResponse.json(
        { ok: false, error: 'mustChangePassword can only be set to true.' },
        { status: 400 },
      );
    }

    profileUpdates.must_change_password = true;
    updates.push('must_change_password');
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await admin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    if (profileUpdates.hr_rank || profileUpdates.must_change_password) {
      if (profileUpdates.must_change_password) {
        tempPassword = generateTempPassword(10);
      }

      const { data: authData, error: authGetError } = await admin.auth.admin.getUserById(userId);
      if (authGetError) {
        return NextResponse.json({ ok: false, error: authGetError.message }, { status: 500 });
      }

      const existingMeta = (authData.user?.user_metadata ?? {}) as Record<string, unknown>;
      const nextMeta: Record<string, unknown> = {
        ...existingMeta,
      };

      if (profileUpdates.hr_rank) {
        nextMeta.hr_rank = profileUpdates.hr_rank;
      }

      if (profileUpdates.must_change_password) {
        nextMeta.must_change_password = true;
      }

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
        ...(tempPassword ? { password: tempPassword } : {}),
        user_metadata: nextMeta,
      });

      if (authUpdateError) {
        return NextResponse.json({ ok: false, error: authUpdateError.message }, { status: 500 });
      }
    }
  }

  if (typeof body.disable === 'boolean') {
    const banDuration = body.disable ? '876000h' : 'none';
    const { error: disableError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (disableError) {
      return NextResponse.json({ ok: false, error: disableError.message }, { status: 500 });
    }

    updates.push('disable');
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid updates provided.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: updates, tempPassword });
}
