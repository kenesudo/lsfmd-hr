'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { data: profileData, error: profilesError } = await admin
    .from('profiles')
    .select('id, username, full_name, lsfmd_rank, hr_rank, must_change_password, created_at, updated_at')
    .order('full_name', { ascending: true });

  if (profilesError) {
    return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
  }

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
  if (usersError) {
    return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 });
  }

  const map = new Map(usersData?.users?.map((user) => [user.id, user]) ?? []);

  const members = (profileData ?? []).map((profile) => {
    const authUser = map.get(profile.id);
    const bannedUntil = (authUser as { banned_until?: string | null } | undefined)?.banned_until ?? null;
    return {
      ...profile,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      is_disabled: Boolean(bannedUntil),
    };
  });

  return NextResponse.json({
    ok: true,
    members,
  });
}
