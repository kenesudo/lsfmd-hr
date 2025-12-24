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
  const monthlySummary = useMemo(() => data?.monthly_summary ?? [], [data]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Commander Tools</p>
                <h1 className="text-2xl font-bold text-foreground">View Scores</h1>
                <div className="mt-2">
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
              </div>
              <Button variant="outline" onClick={fetchScores} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>

            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Leaderboard</h2>
                <p className="text-sm text-muted-foreground">Top performers for the selected month.</p>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-muted-foreground text-sm">No accepted activities within this month.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-3 pr-4 font-medium">Rank</th>
                        <th className="py-3 pr-4 font-medium">Member</th>
                        <th className="py-3 pr-4 font-medium">Activities</th>
                        <th className="py-3 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leaderboard.map((entry, index) => (
                        <tr key={entry.hr_id}>
                          <td className="py-4 pr-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-foreground">
                              {entry.profile?.full_name || entry.hr_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{entry.profile?.username || 'unknown'}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-muted-foreground">{entry.activity_count}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-lg font-bold text-primary">{entry.score}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">Monthly Activity</h2>
                <p className="text-xs text-muted-foreground">Accepted activity breakdown per member.</p>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : monthlySummary.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">No activity yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-2 font-medium text-center">1 pt</th>
                        <th className="py-2 pr-2 font-medium text-center">2 pt</th>
                        <th className="py-2 pr-2 font-medium text-center">3 pt</th>
                        <th className="py-2 font-medium text-right">Total Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {monthlySummary.map((row) => (
                        <tr key={row.hr_id}>
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-foreground">
                              {row.profile?.full_name || row.hr_id}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {row.profile?.hr_rank || ''}
                            </div>
                          </td>
                          <td className="py-3 pr-2 text-center tabular-nums text-foreground">
                            {row.one_point_activities}
                          </td>
                          <td className="py-3 pr-2 text-center tabular-nums text-foreground">
                            {row.two_point_activities}
                          </td>
                          <td className="py-3 pr-2 text-center tabular-nums text-foreground">
                            {row.three_point_activities}
                          </td>
                          <td className="py-3 text-right tabular-nums font-semibold text-foreground">
                            ${row.total_salary.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          </div>
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
  monthly_summary: {
    hr_id: string;
    one_point_activities: number;
    two_point_activities: number;
    three_point_activities: number;
    total_salary: number;
    profile: {
      full_name: string;
      username: string;
      hr_rank: string;
    } | null;
  }[];
};
