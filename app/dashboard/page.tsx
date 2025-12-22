'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ActivityStatus = 'pending' | 'accepted' | 'denied';

type DashboardSummary = {
  total_templates: number;
  pending_reviews: number;
  completed_reviews: number;
  total_activities: number;
  total_score: number;
  activity_breakdown: { activity_type: string; count: number }[];
  recent_activities: {
    id: string;
    activity_type: string;
    status: ActivityStatus;
    created_at: string;
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

  const fetchSummary = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard/summary');
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
        activity_breakdown: data.activity_breakdown ?? [],
        recent_activities: data.recent_activities ?? [],
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
  }, []);

  const breakdownTotal = useMemo(
    () => (summary?.activity_breakdown ?? []).reduce((sum, item) => sum + item.count, 0),
    [summary],
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
            </div>
            <Button variant="outline" onClick={fetchSummary} disabled={refreshing || loading}>
              {refreshing || loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard label="Total Templates" helper="Available BBC templates" value={loading ? '…' : summary?.total_templates ?? 0} />
            <StatCard label="Total Activities" helper="Your submitted logs" value={loading ? '…' : summary?.total_activities ?? 0} />
            <StatCard label="Pending Reviews" helper="Need commander action" value={loading ? '…' : summary?.pending_reviews ?? 0} />
            <StatCard label="Total Score" helper="Accepted activity points" value={loading ? '…' : summary?.total_score ?? 0} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="col-span-1 xl:col-span-2 bg-card border border-border rounded-lg p-6">
              <header className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">Latest submissions within your account</p>
                </div>
                <Link href="/view-activities">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </header>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : summary?.recent_activities?.length ? (
                <div className="divide-y divide-border">
                  {summary.recent_activities.map((activity) => (
                    <article key={activity.id} className="flex items-center justify-between py-4 gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-foreground capitalize">{activity.activity_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${STATUS_STYLES[activity.status]}`}>{activity.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">No activity yet.</div>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Activity Mix</h2>
                <p className="text-sm text-muted-foreground">Distribution of your submissions</p>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
              ) : breakdownTotal === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-center px-4">
                  No data yet. Submit new activities to see insights here.
                </div>
              ) : (
                <div className="space-y-4">
                  {(summary?.activity_breakdown ?? []).map((bucket) => {
                    const percentage = Math.round((bucket.count / breakdownTotal) * 100);
                    return (
                      <div key={bucket.activity_type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-foreground capitalize">{bucket.activity_type.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
