import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { id } = await context.params;

  let body: { salary_per_point: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const salaryPerPoint = Number(body.salary_per_point);

  if (!Number.isFinite(salaryPerPoint) || salaryPerPoint < 0) {
    return NextResponse.json({ ok: false, error: 'Valid salary per point is required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('member_salary_rates')
    .update({ salary_per_point: salaryPerPoint })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, salary_rate: data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { id } = await context.params;

  const { error } = await admin
    .from('member_salary_rates')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
