'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { HR_ROLES } from '@/lib/roles';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import { useState } from 'react';

const LSFMD_RANKS = [
  'Paramedic',
  'Senior Paramedic',
  'Lead Paramedic',
  'Lieutenant',
  'Captain',
  'Assistant Chief',
  'Chief',
] as const;

type Result = {
  username: string;
  tempPassword: string;
  userId: string;
} | null;

export default function CommanderCreateAccountPage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [lsfmdRank, setLsfmdRank] = useState('');
  const [hrRank, setHrRank] = useState('General');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError('Username may only contain lowercase letters, numbers, dot, and underscore.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!lsfmdRank.trim()) {
      setError('LSFMD rank is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/commander/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalized,
          fullName,
          lsfmdRank,
          hrRank,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.ok) {
        setError(data.error || 'Failed to create account.');
        return;
      }

      setResult({
        username: data.username,
        tempPassword: data.tempPassword,
        userId: data.userId,
      });

      setUsername('');
      setFullName('');
      setLsfmdRank('');
      setHrRank('General');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.tempPassword);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Commander tools</p>
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">New user</h2>

              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Username"
                  placeholder="john.smith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input
                  label="Full Name"
                  placeholder="John Smith"
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

                <Select
                  label="HR Role"
                  value={hrRank}
                  onChange={(e) => setHrRank(e.target.value)}
                  options={HR_ROLES.map((r) => ({ value: r, label: r }))}
                />

                {error && (
                  <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating…' : 'Create account'}
                </Button>
              </form>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Temporary password</h2>

              {!result ? (
                <p className="text-sm text-muted-foreground">
                  After creating an account, the temporary password will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Username</div>
                    <div className="font-semibold text-foreground">{result.username}</div>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Temporary password</div>
                    <div className="font-mono text-lg font-semibold text-foreground">{result.tempPassword}</div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="primary" onClick={copy}>
                      Copy password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResult(null)}
                    >
                      Clear
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    The user will be forced to change password on first login.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
