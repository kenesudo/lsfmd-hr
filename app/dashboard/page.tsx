'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date();
  date.setMonth(date.getMonth() - index, 1);
  const value = formatMonth(date);
  return {
    value,
    label: date.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
  };
});

type ActivityStatus = 'pending' | 'accepted' | 'denied';

type DashboardSummary = {
  total_templates: number;
  pending_reviews: number;
  completed_reviews: number;
  total_activities: number;
  total_score: number;
  total_salary: number;
  activity_breakdown: { process_group: string; count: number }[];
  recent_activities: {
    id: string;
    activity_type: string;
    activity_label: string;
    process_group: string;
    status: ActivityStatus;
    created_at: string;
  }[];
  leaderboard: {
    hr_id: string;
    full_name: string;
    username: string;
    hr_rank: string;
    total_salary: number;
    total_points: number;
  }[];
};

const STATUS_STYLES: Record<ActivityStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonth(new Date()));

  const fetchSummary = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ month: selectedMonth });
      const res = await fetch(`/api/dashboard/summary?${params.toString()}`);
      const data = (await res.json()) as { ok: boolean; error?: string } & DashboardSummary;

      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to load dashboard overview');
        return;
      }

      setSummary({
        total_templates: data.total_templates ?? 0,
        pending_reviews: data.pending_reviews ?? 0,
        completed_reviews: data.completed_reviews ?? 0,
        total_activities: data.total_activities ?? 0,
        total_score: data.total_score ?? 0,
        total_salary: data.total_salary ?? 0,
        activity_breakdown: data.activity_breakdown ?? [],
        recent_activities: data.recent_activities ?? [],
        leaderboard: data.leaderboard ?? [],
      });
    } catch {
      toast.error('Failed to load dashboard overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const breakdownTotal = useMemo(
    () => (summary?.activity_breakdown ?? []).reduce((sum, item) => sum + item.count, 0),
    [summary],
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <Select
                label=""
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={MONTH_OPTIONS}
              />
              <Button variant="outline" onClick={fetchSummary} disabled={refreshing || loading}>
                {refreshing || loading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard 
              label="My Salary" 
              helper="Total earnings this month" 
              value={loading ? '…' : `$${(summary?.total_salary ?? 0).toFixed(2)}`} 
            />
            <StatCard 
              label="My Activities" 
              helper="Submitted this month" 
              value={loading ? '…' : summary?.total_activities ?? 0} 
            />
            <StatCard 
              label="Pending Reviews" 
              helper="This month, awaiting review" 
              value={loading ? '…' : summary?.pending_reviews ?? 0} 
            />
            <StatCard 
              label="Total Points" 
              helper="Accepted points this month" 
              value={loading ? '…' : summary?.total_score ?? 0} 
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="col-span-1 xl:col-span-2 bg-card border border-border rounded-lg p-4">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                  <p className="text-xs text-muted-foreground">Latest submissions within your account</p>
                </div>
                <Link href="/my-activities">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </header>

              {loading ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : summary?.recent_activities?.length ? (
                <div className="divide-y divide-border">
                  {summary.recent_activities.map((activity) => (
                    <article key={activity.id} className="flex items-center justify-between py-2.5 gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{activity.activity_label}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{activity.process_group}</span>
                          <span>•</span>
                          <span>
                            {new Date(activity.created_at).toLocaleString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[activity.status]}`}>{activity.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">No activity yet.</div>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Activity Mix</h2>
                <p className="text-xs text-muted-foreground">Distribution by process group (this month)</p>
              </div>

              {loading ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : breakdownTotal === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-center px-4 text-xs">
                  No data yet. Submit new activities to see insights here.
                </div>
              ) : (
                <div className="space-y-3">
                  {(summary?.activity_breakdown ?? []).map((bucket) => {
                    const percentage = Math.round((bucket.count / breakdownTotal) * 100);
                    return (
                      <div key={bucket.process_group}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-foreground capitalize">{bucket.process_group.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
              <p className="text-xs text-muted-foreground">Top 3 HR members for this month</p>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : summary?.leaderboard?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4 font-medium">#</th>
                      <th className="py-2 pr-4 font-medium">Member</th>
                      <th className="py-2 pr-4 font-medium">HR Rank</th>
                      <th className="py-2 pr-4 font-medium text-right">Points</th>
                      <th className="py-2 font-medium text-right">Total Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.leaderboard.map((member, idx) => (
                      <tr key={member.hr_id}>
                        <td className="py-2 pr-4 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 pr-4">
                          <div className="font-medium text-foreground">{member.full_name}</div>
                          <div className="text-xs text-muted-foreground">@{member.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{member.hr_rank}</td>
                        <td className="py-2 pr-4 text-right text-foreground">{member.total_points}</td>
                        <td className="py-2 text-right font-semibold text-foreground">${member.total_salary.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">No leaderboard data yet.</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number | string;
  helper: string;
};

const StatCard = ({ label, value, helper }: StatCardProps) => (
  <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
    <p className="text-xs text-muted-foreground mt-2">{helper}</p>
  </div>
);
