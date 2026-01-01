'use server';

import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limitRaw = Number(searchParams.get('limit') || '200');
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

  const query = admin
    .from('login_history')
    .select('id, user_id, ip, user_agent, created_at, profiles!login_history_user_id_fkey(full_name, username)')
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row: any) => {
    const profile = row.profiles ?? null;
    return {
      id: row.id,
      user_id: row.user_id,
      ip: row.ip ?? null,
      user_agent: row.user_agent ?? null,
      created_at: row.created_at,
      full_name: profile?.full_name ?? null,
      username: profile?.username ?? null,
    };
  });

  const filtered = q
    ? rows.filter((r) => {
        const hay = `${r.full_name ?? ''} ${r.username ?? ''} ${r.ip ?? ''} ${r.user_agent ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
    : rows;

  return NextResponse.json({ ok: true, rows: filtered });
}
