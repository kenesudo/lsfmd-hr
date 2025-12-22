'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { HR_ROLES, type HrRole } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
  hrRank?: HrRole;
  disable?: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: {
    params?: {
      id?: string;
    };
  },
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const userId =
    context.params?.id || (() => {
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

  if (typeof body.hrRank === 'string') {
    if (!(HR_ROLES as readonly string[]).includes(body.hrRank)) {
      return NextResponse.json({ ok: false, error: 'Invalid HR role selection.' }, { status: 400 });
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ hr_rank: body.hrRank })
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { hr_rank: body.hrRank },
    });

    if (authError) {
      return NextResponse.json({ ok: false, error: authError.message }, { status: 500 });
    }

    updates.push('hr_rank');
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

  return NextResponse.json({ ok: true, updated: updates });
}
