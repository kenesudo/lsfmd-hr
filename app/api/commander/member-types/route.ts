import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { data, error } = await admin
    .from('member_types')
    .select('*')
    .order('key', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, member_types: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  let body: { key: string; label: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const key = (body.key || '').trim();
  const label = (body.label || '').trim();

  if (!key || !label) {
    return NextResponse.json({ ok: false, error: 'Key and label are required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('member_types')
    .insert({ key, label })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, member_type: data });
}
