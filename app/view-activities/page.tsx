'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Sidebar from '@/components/Sidebar';
import { renderBbcode } from '@/lib/bbcode';
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
  process_group: string;
  activity_label: string;
  status: 'pending' | 'accepted' | 'denied';
  salary: number | null;
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

type TabStatus = 'pending' | 'accepted' | 'denied';

export default function ViewActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'all');
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

    return activities.filter((a) => {
      const matchesStatus = a.status === activeTab;
      const matchesTerm = term
        ? [a.hr?.full_name, a.hr?.username, a.activity_type].some((v) => v?.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesTerm;
    });
  }, [activities, search, activeTab]);

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
    <>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto p-4">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Commander tools</p>
                    <h1 className="text-3xl font-bold text-foreground">View Activities</h1>
                  </div>
                  <Button onClick={handleRefresh} variant="outline" disabled={loading || refreshing}>
                    {refreshing || loading ? 'Refreshing…' : 'Refresh list'}
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[250px]">
                      <Input
                        label="Search"
                        placeholder="Search HR name, username, activity type"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-sm space-y-1">
                        <div className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{activities.length}</span></div>
                        <div className="text-muted-foreground">Pending: <span className="font-semibold text-foreground">{activities.filter((a) => a.status === 'pending').length}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-border">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'pending'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Pending ({activities.filter((a) => a.status === 'pending').length})
                      </button>
                      <button
                        onClick={() => setActiveTab('accepted')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'accepted'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Accepted ({activities.filter((a) => a.status === 'accepted').length})
                      </button>
                      <button
                        onClick={() => setActiveTab('denied')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'denied'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Denied ({activities.filter((a) => a.status === 'denied').length})
                      </button>
                    </div>
                  </div>

                  <div className="w-full">
                    {loading ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">Loading activities…</div>
                    ) : filtered.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <p className="text-lg font-semibold text-foreground">No activities found</p>
                        <p className="text-sm">Adjust your filters or refresh the list.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground border-b border-border">
                              <th className="py-2 pr-4 font-medium">HR Member</th>
                              <th className="py-2 pr-4 font-medium">Activity Type</th>
                              <th className="py-2 pr-4 font-medium">Process Group</th>
                              <th className="py-2 pr-4 font-medium">Salary</th>
                              <th className="py-2 pr-4 font-medium">Created</th>
                              {activeTab !== 'pending' && <th className="py-2 pr-4 font-medium">Reviewed</th>}
                              <th className="py-2 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filtered.map((activity) => (
                              <tr key={activity.id} className="align-top">
                                <td className="py-4 pr-4">
                                  <div className="font-semibold text-foreground">
                                    {activity.hr?.full_name || activity.hr_id}
                                  </div>
                                  {activity.hr?.username && (
                                    <div className="text-xs text-muted-foreground">@{activity.hr.username}</div>
                                  )}
                                </td>
                                <td className="py-4 pr-4">
                                  <div className="font-medium text-foreground">{activity.activity_label}</div>
                                  <div className="text-xs text-muted-foreground">{activity.activity_type}</div>
                                </td>
                                <td className="py-4 pr-4">
                                  <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground capitalize">
                                    {activity.process_group}
                                  </span>
                                </td>
                                <td className="py-4 pr-4">
                                  {activity.salary ? (
                                    <span className="text-foreground font-medium">${activity.salary.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-4 pr-4">
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(activity.created_at).toLocaleString()}
                                  </div>
                                </td>
                                {activeTab !== 'pending' && (
                                  <td className="py-4 pr-4">
                                    <div className="text-xs text-muted-foreground">
                                      {activity.reviewed_at ? new Date(activity.reviewed_at).toLocaleString() : '—'}
                                    </div>
                                    {activity.reviewer && (
                                      <div className="text-xs text-muted-foreground">
                                        by {activity.reviewer.full_name}
                                      </div>
                                    )}
                                    {activity.deny_reason && (
                                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        Reason: {activity.deny_reason}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewActivity(activity)}
                                      className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                      aria-label="View details"
                                    >
                                      Details
                                    </button>
                                    {activity.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={Boolean(updatingId)}
                                          onClick={() => updateActivityStatus(activity.id, 'accepted')}
                                        >
                                          Accept
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={Boolean(updatingId)}
                                          onClick={() => updateActivityStatus(activity.id, 'denied')}
                                        >
                                          Deny
                                        </Button>
                                      </>
                                    )}
                                  </div>
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
      </div>

      {previewActivity ? (
        <ActivityPreviewDialog activity={previewActivity} onClose={() => setPreviewActivity(null)} />
      ) : null}
    </>
  );
}

type ActivityPreviewDialogProps = {
  activity: Activity;
  onClose: () => void;
};

function ActivityPreviewDialog({ activity, onClose }: ActivityPreviewDialogProps) {
  const reviewedDisplay = activity.reviewed_at ? new Date(activity.reviewed_at).toLocaleString() : null;
  const parsedBBC = renderBbcode(activity.bbc_content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl border border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Activity Details</p>
            <h2 className="text-2xl font-semibold text-foreground">{activity.hr?.full_name || activity.hr_id}</h2>
            {activity.hr?.username && <p className="text-sm text-muted-foreground">@{activity.hr.username}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <span className="font-semibold text-foreground">Type:</span> {activity.activity_type}
          </div>
          <div>
            <span className="font-semibold text-foreground">Status:</span> {activity.status}
          </div>
          <div>
            <span className="font-semibold text-foreground">Created:</span>{' '}
            {new Date(activity.created_at).toLocaleString()}
          </div>
          {reviewedDisplay ? (
            <div>
              <span className="font-semibold text-foreground">Reviewed:</span> {reviewedDisplay}
            </div>
          ) : null}
          {activity.reviewer ? (
            <div>
              <span className="font-semibold text-foreground">Reviewer:</span> {activity.reviewer.full_name}
            </div>
          ) : null}
          {activity.deny_reason ? (
            <div className="sm:col-span-2">
              <span className="font-semibold text-foreground">Deny reason:</span> {activity.deny_reason}
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Parsed BBCode Preview</p>
          <div className="mt-4 p-4 bg-secondary rounded-md h-[500px]">
            <BbcodePreview
              html={renderBbcode(activity.bbc_content)}
              title="BBCode preview"
            />
          </div>          
            <p className="text-xs text-muted-foreground">
            Raw BBCode:
            <span className="block whitespace-pre-wrap rounded-md border border-dashed border-border bg-background p-3 font-mono text-[11px] text-foreground mt-2">
              {activity.bbc_content}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
