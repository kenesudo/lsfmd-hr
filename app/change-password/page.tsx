'use client';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChangePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const { error: updateErr } = await supabase.auth.updateUser({
        password,
        data: {
          must_change_password: false,
        },
      });

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Change password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account uses a temporary password. Please set a new password to continue.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
