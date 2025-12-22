'use client';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Navbar from '@/components/Navbar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { isValidUsername, usernameToEmail } from '@/lib/username';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

function SearchParamsWrapper({ children }: { children: (next: string) => React.ReactNode }) {
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get('next') || '/dashboard', [searchParams]);
  return <>{children(next)}</>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    }>
      <SearchParamsWrapper>
        {(next) => <LoginForm next={next} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}

function LoginForm({ next }: { next: string }) {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const normalizedUsername = username.trim();
      if (!normalizedUsername) {
        setError('Username is required.');
        return;
      }

      if (!isValidUsername(normalizedUsername)) {
        setError('Username may only contain lowercase letters, numbers, dot, and underscore.');
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(normalizedUsername),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.must_change_password) {
        router.replace('/change-password');
        router.refresh();
        return;
      }

      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Use your assigned account credentials. Registration is disabled.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Username"
              autoComplete="username"
              placeholder="your.username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-xs text-muted-foreground">
            If you don’t have an account, contact a Commander.
          </div>
        </div>
      </div>
    </div>
  );
}
