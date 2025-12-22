'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { renderBbcode } from '@/lib/bbcode';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ActivityStatus = 'pending' | 'accepted' | 'denied';

type ActivityRow = {
  id: string;
  bbc_content: string;
  activity_type: string;
  status: ActivityStatus;
  created_at: string;
  reviewed_at: string | null;
  deny_reason: string | null;
};

type ActivityTypeRow = {
  key: string;
  score: number;
  label: string;
};

const STATUS_FILTERS: { value: 'all' | ActivityStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'denied', label: 'Denied' },
];

export default function MyActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [typeRows, setTypeRows] = useState<ActivityTypeRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('all');

  const [previewActivity, setPreviewActivity] = useState<ActivityRow | null>(null);

  const scoreMap = useMemo(() => {
    return new Map<string, number>(typeRows.map((r) => [r.key, Number(r.score) || 0]));
  }, [typeRows]);

  const labelMap = useMemo(() => {
    return new Map<string, string>(typeRows.map((r) => [r.key, r.label]));
  }, [typeRows]);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const [{ data: authData, error: authErr }, { data: activityData, error: activityErr }, { data: typeData, error: typeErr }] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('hr_activities')
            .select('id, bbc_content, activity_type, status, created_at, reviewed_at, deny_reason')
            .order('created_at', { ascending: false }),
          supabase.from('hr_activities_type').select('key, score, label'),
        ]);

      if (authErr || !authData.user) {
        toast.error('You must be signed in.');
        setActivities([]);
        setTypeRows([]);
        return;
      }

      if (activityErr || typeErr) {
        toast.error(activityErr?.message || typeErr?.message || 'Failed to load activities');
        setActivities([]);
        setTypeRows([]);
        return;
      }

      setActivities((activityData ?? []) as ActivityRow[]);
      setTypeRows((typeData ?? []) as ActivityTypeRow[]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return activities.filter((a) => {
      const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
      const matchesTerm = term
        ? [a.activity_type, labelMap.get(a.activity_type)].some((v) => v?.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesTerm;
    });
  }, [activities, labelMap, search, statusFilter]);

  const computePoints = (a: ActivityRow) => {
    const base = scoreMap.get(a.activity_type) ?? 0;
    if (a.status === 'accepted') return { points: base, label: 'Earned' };
    if (a.status === 'pending') return { points: base, label: 'Due' };
    return { points: 0, label: 'Earned' };
  };

  const pendingCount = useMemo(() => activities.filter((a) => a.status === 'pending').length, [activities]);
  const acceptedCount = useMemo(() => activities.filter((a) => a.status === 'accepted').length, [activities]);
  const deniedCount = useMemo(() => activities.filter((a) => a.status === 'denied').length, [activities]);

  const totalEarned = useMemo(() => {
    return activities.reduce((sum, a) => {
      const base = scoreMap.get(a.activity_type) ?? 0;
      return sum + (a.status === 'accepted' ? base : 0);
    }, 0);
  }, [activities, scoreMap]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Your account</p>
                    <h1 className="text-3xl font-bold text-foreground">My Activities</h1>
                  </div>
                  <Button onClick={fetchAll} variant="outline" disabled={loading || refreshing}>
                    {loading || refreshing ? 'Refreshing…' : 'Refresh'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                    <div className="space-y-4">
                      <Input
                        label="Search"
                        placeholder="Search activity type"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />

                      <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
                      />
                    </div>

                    <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold text-foreground">{activities.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-foreground">{pendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Accepted</span>
                        <span className="font-semibold text-foreground">{acceptedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Denied</span>
                        <span className="font-semibold text-foreground">{deniedCount}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Total earned</span>
                        <span className="font-semibold text-foreground">{totalEarned}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
                    {loading ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">Loading activities…</div>
                    ) : rows.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <p className="text-lg font-semibold text-foreground">No activities found</p>
                        <p className="text-sm">Submit an activity to see it here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rows.map((activity) => {
                          const points = computePoints(activity);
                          const label = labelMap.get(activity.activity_type);

                          return (
                            <div key={activity.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0">
                                  <div className="text-xs text-muted-foreground">Type</div>
                                  <div className="font-semibold text-foreground">
                                    {label?.trim() ? label : activity.activity_type}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">Key: {activity.activity_type}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Created: {new Date(activity.created_at).toLocaleString()}
                                  </div>
                                  {activity.reviewed_at ? (
                                    <div className="text-xs text-muted-foreground">
                                      Reviewed: {new Date(activity.reviewed_at).toLocaleString()}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
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

                                  <span className="text-xs px-2 py-1 rounded-full border border-border text-foreground">
                                    {points.label}: {points.points}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setPreviewActivity(activity)}
                                    className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    aria-label="View details"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={1.8}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12Z"
                                      />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6Z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {activity.deny_reason ? (
                                <div className="mt-3 text-sm text-muted-foreground">
                                  Deny reason: <span className="text-foreground">{activity.deny_reason}</span>
                                </div>
                              ) : null}

                              <div className="mt-3">
                                <label className="block text-xs font-medium text-muted-foreground mb-2">BBC Content</label>
                                <textarea
                                  readOnly
                                  value={activity.bbc_content}
                                  className="w-full h-32 rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground"
                                />
                              </div>
                            </div>
                          );
                        })}
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
        <MyActivityPreviewDialog
          activity={previewActivity}
          score={scoreMap.get(previewActivity.activity_type) ?? 0}
          label={labelMap.get(previewActivity.activity_type) ?? ''}
          onClose={() => setPreviewActivity(null)}
        />
      ) : null}
    </>
  );
}

type MyActivityPreviewDialogProps = {
  activity: ActivityRow;
  score: number;
  label: string;
  onClose: () => void;
};

function MyActivityPreviewDialog({ activity, score, label, onClose }: MyActivityPreviewDialogProps) {
  const reviewedDisplay = activity.reviewed_at ? new Date(activity.reviewed_at).toLocaleString() : null;

  const points = (() => {
    if (activity.status === 'accepted') return { points: score, label: 'Earned' };
    if (activity.status === 'pending') return { points: score, label: 'Due' };
    return { points: 0, label: 'Earned' };
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl border border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Activity Details</p>
            <h2 className="text-2xl font-semibold text-foreground">{label?.trim() ? label : activity.activity_type}</h2>
            <p className="text-sm text-muted-foreground">Key: {activity.activity_type}</p>
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
            <span className="font-semibold text-foreground">Status:</span> {activity.status}
          </div>
          <div>
            <span className="font-semibold text-foreground">{points.label} points:</span> {points.points}
          </div>
          <div>
            <span className="font-semibold text-foreground">Created:</span> {new Date(activity.created_at).toLocaleString()}
          </div>
          {reviewedDisplay ? (
            <div>
              <span className="font-semibold text-foreground">Reviewed:</span> {reviewedDisplay}
            </div>
          ) : null}
          {activity.deny_reason ? (
            <div className="sm:col-span-2">
              <span className="font-semibold text-foreground">Deny reason:</span> {activity.deny_reason}
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Parsed BBC Preview</p>
          <div className="mt-4 p-4 bg-secondary rounded-md h-[500px]">
            <BbcodePreview html={renderBbcode(activity.bbc_content)} title="BBC preview" />
          </div>

          <p className="text-xs text-muted-foreground">
            Raw BBC:
            <span className="block whitespace-pre-wrap rounded-md border border-dashed border-border bg-background p-3 font-mono text-[11px] text-foreground mt-2">
              {activity.bbc_content}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
