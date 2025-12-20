'use client';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LSFMD_RANKS = [
  'Paramedic',
  'Senior Paramedic',
  'Lead Paramedic',
  'Lieutenant',
  'Captain',
  'Assistant Chief',
  'Chief',
];

export default function SetupPage() {
  const router = useRouter();

  const [setupToken, setSetupToken] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [lsfmdRank, setLsfmdRank] = useState('Chief');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!setupToken.trim()) {
      setError('Setup token is required.');
      return;
    }

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

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
      const res = await fetch('/api/setup/create-commander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupToken,
          username,
          fullName,
          lsfmdRank,
          password,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.ok) {
        setError(data.error || 'Failed to create Commander account.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bootstrap Setup</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create the initial Commander account. This page should only be used once during initial setup.
          </p>
        </div>

        {success ? (
          <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground">
            ✓ Commander account created successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Setup Token"
              type="password"
              placeholder="Enter setup token from .env"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              required
            />

            <Input
              label="Username"
              placeholder="commander"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label="Full Name"
              placeholder="Commander Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Select
              label="LSFMD Rank"
              value={lsfmdRank}
              onChange={(e) => setLsfmdRank(e.target.value)}
              options={LSFMD_RANKS.map((r) => ({ value: r, label: r }))}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
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
              {loading ? 'Creating…' : 'Create Commander Account'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-xs text-muted-foreground">
          After creating the Commander account, you can log in and use the Commander tools to create additional users.
        </div>
      </div>
    </div>
  );
}
