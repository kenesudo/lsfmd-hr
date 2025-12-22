import { ADMIN_ROLES } from '@/lib/roles';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type EnsureAdminSuccess = {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
};

type EnsureAdminFailure = {
  errorResponse: NextResponse;
};

export type EnsureAdminResult = EnsureAdminSuccess | EnsureAdminFailure;

export const ensureCommander = async (request: NextRequest): Promise<EnsureAdminResult> => {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { errorResponse: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('hr_rank')
    .eq('id', user.id)
    .maybeSingle();

  const callerRole = profile?.hr_rank ?? null;
  if (!callerRole || !(ADMIN_ROLES as readonly string[]).includes(callerRole)) {
    return { errorResponse: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return {
    admin: createSupabaseAdminClient(),
    userId: user.id,
  };
};
