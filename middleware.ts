import { ADMIN_ROLES } from '@/lib/roles';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/change-password', '/commander', '/applications', '/reinstatement', '/trainings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

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
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/commander' || pathname.startsWith('/commander/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('hr_rank')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.hr_rank ?? null;
    if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  if (user.user_metadata?.must_change_password && pathname !== '/change-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/change-password';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/change-password', '/commander/:path*', '/applications/:path*', '/reinstatement/:path*', '/trainings/:path*'],
};
