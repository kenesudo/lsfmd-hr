import { ADMIN_ROLES, type HrRole } from '@/lib/roles';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { generateTempPassword } from '@/lib/tempPassword';
import { isValidUsername, normalizeUsername, usernameToEmail } from '@/lib/username';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type Body = {
  username: string;
  fullName: string;
  lsfmdRank: string;
  hrRank: HrRole;
  memberType?: 'part-time' | 'full-time';
};

const isMemberType = (value: string): value is 'part-time' | 'full-time' => {
  return (['part-time', 'full-time'] as const).includes(value as 'part-time' | 'full-time');
};

const isHrRole = (value: string): value is HrRole => {
  return (['Commander', 'Assistant Commander', 'Supervisory Instructor', 'General Instructor', 'Probationary Instructor'] as readonly string[]).includes(
    value,
  );
};

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: false }, { status: 500 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify caller is Commander/Assistant Commander from profiles
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('hr_rank')
    .eq('id', user.id)
    .maybeSingle();

  const callerRole = callerProfile?.hr_rank ?? null;
  if (!callerRole || !(ADMIN_ROLES as readonly string[]).includes(callerRole)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const username = normalizeUsername(body.username || '');
  const fullName = (body.fullName || '').trim();
  const lsfmdRank = (body.lsfmdRank || '').trim();
  const hrRank = (body.hrRank || '').trim();
  const memberTypeRaw = typeof body.memberType === 'string' ? body.memberType : 'part-time';
  const memberType = isMemberType(memberTypeRaw) ? memberTypeRaw : null;

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

  if (!isHrRole(hrRank)) {
    return NextResponse.json({ ok: false, error: 'Invalid HR role.' }, { status: 400 });
  }

  if (!memberType) {
    return NextResponse.json({ ok: false, error: 'Invalid member type.' }, { status: 400 });
  }

  const tempPassword = generateTempPassword(10);
  const email = usernameToEmail(username);

  const admin = createSupabaseAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      username,
      hr_rank: hrRank,
      must_change_password: true,
    },
  });

  if (createErr || !created.user) {
    return NextResponse.json({ ok: false, error: createErr?.message || 'Failed to create user.' }, { status: 400 });
  }

  const profileInsert = await admin.from('profiles').insert({
    id: created.user.id,
    username,
    full_name: fullName,
    lsfmd_rank: lsfmdRank,
    hr_rank: hrRank,
    member_type: memberType,
    must_change_password: true,
  });

  if (profileInsert.error) {
    // Rollback auth user to avoid orphaned account
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
    tempPassword,
  });
}
