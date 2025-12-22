'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const formatMonth = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - index, 1);
  return formatMonth(date);
});

export default function ViewScoresPage() {
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month });
      const res = await fetch(`/api/commander/scores?${params.toString()}`);
      const json = (await res.json()) as ScoreResponse;
      if (!res.ok || !json.ok) {
        setError(json.error || 'Failed to load scores');
        toast.error(json.error || 'Failed to load scores');
        return;
      }
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scores';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data]);
  const activities = useMemo(() => data?.activities ?? [], [data]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Commander Tools</p>
              <h1 className="text-2xl font-bold text-foreground">View Scores</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Month</label>
                <select
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="ml-2 h-10 rounded-md border border-border bg-input px-3 text-sm"
                >
                  {MONTH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {new Date(option + '-01T00:00:00Z').toLocaleString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={fetchScores} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
          </header>

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Leaderboard</h2>
                <p className="text-sm text-muted-foreground">Top performers for the selected month.</p>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-muted-foreground text-sm">No accepted activities within this month.</div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.hr_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {index + 1}. {entry.profile?.full_name || entry.hr_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{entry.profile?.username || 'unknown'} • {entry.activity_count} activities
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="xl:col-span-2 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Monthly Activity</h2>
                  <p className="text-sm text-muted-foreground">Accepted activities during this period.</p>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : activities.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">No activity yet.</div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg p-4">
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {activity.activity_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-muted-foreground">
                          {activity.profile?.full_name || 'Unknown'} • @{activity.profile?.username || 'unknown'}
                        </p>
                        <p className="text-sm font-semibold text-foreground">+{activity.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type ScoreResponse = {
  ok: boolean;
  error?: string;
  month?: string;
  start?: string;
  end?: string;
  leaderboard: {
    hr_id: string;
    score: number;
    activity_count: number;
    profile: {
      full_name: string;
      username: string;
      hr_rank: string;
    } | null;
  }[];
  activities: {
    id: string;
    hr_id: string;
    activity_type: string;
    created_at: string;
    status: string;
    score: number;
    profile: {
      full_name: string;
      username: string;
      hr_rank: string;
    } | null;
  }[];
};
