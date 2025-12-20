import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isValidUsername, normalizeUsername, usernameToEmail } from '@/lib/username';
import { NextResponse, type NextRequest } from 'next/server';

type Body = {
  setupToken: string;
  username: string;
  fullName: string;
  lsfmdRank: string;
  password: string;
};

export async function POST(request: NextRequest) {
  const setupToken = process.env.SETUP_TOKEN;

  if (!setupToken) {
    return NextResponse.json(
      { ok: false, error: 'Setup is disabled. SETUP_TOKEN not configured.' },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.setupToken !== setupToken) {
    return NextResponse.json({ ok: false, error: 'Invalid setup token' }, { status: 403 });
  }

  const username = normalizeUsername(body.username || '');
  const fullName = (body.fullName || '').trim();
  const lsfmdRank = (body.lsfmdRank || '').trim();
  const password = (body.password || '').trim();

  if (!username || !isValidUsername(username)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid username. Use only a-z, 0-9, dot, underscore.' },
      { status: 400 }
    );
  }

  if (!fullName) {
    return NextResponse.json({ ok: false, error: 'Full name is required.' }, { status: 400 });
  }

  if (!lsfmdRank) {
    return NextResponse.json({ ok: false, error: 'LSFMD rank is required.' }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const email = usernameToEmail(username);
  const admin = createSupabaseAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      hr_rank: 'Commander',
      must_change_password: false,
    },
  });

  if (createErr || !created.user) {
    return NextResponse.json(
      { ok: false, error: createErr?.message || 'Failed to create user.' },
      { status: 400 }
    );
  }

  const profileInsert = await admin.from('profiles').insert({
    id: created.user.id,
    username,
    full_name: fullName,
    lsfmd_rank: lsfmdRank,
    hr_rank: 'Commander',
    must_change_password: false,
  });

  if (profileInsert.error) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { ok: false, error: profileInsert.error.message || 'Failed to create profile.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId: created.user.id,
    username,
  });
}
