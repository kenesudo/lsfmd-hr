import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { key } = await context.params;

  let body: { label: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const label = (body.label || '').trim();
  if (!label) {
    return NextResponse.json({ ok: false, error: 'Label is required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('member_types')
    .update({ label })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, member_type: data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { key } = await context.params;

  // Check if any profiles use this member type
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('member_type', key);

  if (count && count > 0) {
    return NextResponse.json(
      { ok: false, error: `Cannot delete member type: ${count} profile(s) are using it` },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from('member_types')
    .delete()
    .eq('key', key);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
