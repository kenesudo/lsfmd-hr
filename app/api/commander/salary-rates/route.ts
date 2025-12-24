import { ensureCommander } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  const { data, error } = await admin
    .from('member_salary_rates')
    .select('*')
    .order('member_type_key', { ascending: true })
    .order('effective_from', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, salary_rates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authResult = await ensureCommander(request);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const { admin } = authResult;

  let body: { member_type_key: string; salary_per_point: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const memberTypeKey = (body.member_type_key || '').trim();
  const salaryPerPoint = Number(body.salary_per_point);

  if (!memberTypeKey) {
    return NextResponse.json({ ok: false, error: 'Member type key is required' }, { status: 400 });
  }

  if (!Number.isFinite(salaryPerPoint) || salaryPerPoint < 0) {
    return NextResponse.json({ ok: false, error: 'Valid salary per point is required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('member_salary_rates')
    .insert({
      member_type_key: memberTypeKey,
      salary_per_point: salaryPerPoint,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, salary_rate: data });
}
