'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ProfileLite = {
  id: string;
  full_name: string;
  username: string;
  hr_rank: string;
} | null;

type Activity = {
  id: string;
  hr_id: string;
  bbc_content: string;
  activity_type: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  deny_reason: string | null;
  hr: ProfileLite;
  reviewer: ProfileLite;
};

type ApiResponse = {
  ok: boolean;
  activities: Activity[];
  error?: string;
};

type PatchResponse = {
  ok: boolean;
  activity?: {
    id: string;
    status: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    deny_reason: string | null;
  };
  error?: string;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'denied', label: 'Denied' },
] as const;

export default function ViewActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('pending');

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/commander/activities?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to load activities');
        return;
      }
      setActivities(data.activities);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const status = statusFilter;

    return activities.filter((a) => {
      const matchesStatus = status === 'all' ? true : a.status === status;
      const matchesTerm = term
        ? [a.hr?.full_name, a.hr?.username, a.activity_type].some((v) => v?.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesTerm;
    });
  }, [activities, search, statusFilter]);

  const updateActivityStatus = async (activityId: string, status: 'accepted' | 'denied') => {
    if (updatingId) return;

    let denyReason: string | null = null;
    if (status === 'denied') {
      denyReason = window.prompt('Reason for denial (optional):', '') ?? null;
    }

    setUpdatingId(activityId);
    try {
      const res = await fetch(`/api/commander/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, denyReason }),
      });

      const data = (await res.json()) as PatchResponse;
      if (!res.ok || !data.ok || !data.activity) {
        toast.error(data.error || 'Failed to update activity');
        return;
      }

      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                status: data.activity!.status as Activity['status'],
                reviewed_at: data.activity!.reviewed_at,
                reviewed_by: data.activity!.reviewed_by,
                deny_reason: data.activity!.deny_reason,
              }
            : a,
        ),
      );

      toast.success(status === 'accepted' ? 'Activity accepted' : 'Activity denied');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update activity');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Commander tools</p>
                  <h1 className="text-3xl font-bold text-foreground">View Activities</h1>
                </div>
                <Button onClick={handleRefresh} variant="outline" disabled={loading || refreshing}>
                  {refreshing || loading ? 'Refreshing…' : 'Refresh list'}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <div className="space-y-4">
                    <Input
                      label="Search"
                      placeholder="Search HR name, username, activity type"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <Select
                      label="Status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number]['value'])}
                      options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
                    />

                    <Button
                      variant="primary"
                      onClick={() => fetchActivities()}
                      disabled={loading || Boolean(updatingId)}
                      className="w-full"
                    >
                      Apply filters
                    </Button>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-foreground">{activities.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-foreground">{activities.filter((a) => a.status === 'pending').length}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
                  {loading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">Loading activities…</div>
                  ) : filtered.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <p className="text-lg font-semibold text-foreground">No activities found</p>
                      <p className="text-sm">Adjust your filters or refresh the list.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map((activity) => (
                        <div key={activity.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <div className="text-sm text-muted-foreground">HR</div>
                              <div className="font-semibold text-foreground">
                                {activity.hr?.full_name || activity.hr_id}
                              </div>
                              {activity.hr?.username && (
                                <div className="text-xs text-muted-foreground">@{activity.hr.username}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                Type: <span className="text-foreground">{activity.activity_type}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(activity.created_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  activity.status === 'pending'
                                    ? 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400'
                                    : activity.status === 'accepted'
                                      ? 'border-green-500/40 text-green-600 dark:text-green-400'
                                      : 'border-red-500/40 text-red-600 dark:text-red-400'
                                }`}
                              >
                                {activity.status}
                              </span>

                              <Button
                                variant="outline"
                                disabled={Boolean(updatingId) || activity.status !== 'pending'}
                                onClick={() => updateActivityStatus(activity.id, 'accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                disabled={Boolean(updatingId) || activity.status !== 'pending'}
                                onClick={() => updateActivityStatus(activity.id, 'denied')}
                              >
                                Deny
                              </Button>
                            </div>
                          </div>

                          {activity.deny_reason && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              Deny reason: <span className="text-foreground">{activity.deny_reason}</span>
                            </div>
                          )}

                          <div className="mt-3">
                            <label className="block text-xs font-medium text-muted-foreground mb-2">BBC Content</label>
                            <textarea
                              readOnly
                              value={activity.bbc_content}
                              className="w-full h-40 rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
