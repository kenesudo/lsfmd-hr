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

type ActivityRow = {
  id: string;
  bbc_content: string;
  activity_type: string;
  status: ActivityStatus;
  created_at: string;
  reviewed_at: string | null;
  deny_reason: string | null;
  salary: number | null;
};

type ActivityTypeRow = {
  key: string;
  score: number;
  label: string;
  process_group: string;
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
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonth(new Date()));

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
      
      // Parse selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const [{ data: authData, error: authErr }, { data: activityData, error: activityErr }, { data: typeData, error: typeErr }] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('hr_activities')
            .select('id, bbc_content, activity_type, status, salary, created_at, reviewed_at, deny_reason')
            .gte('created_at', startDate)
            .lt('created_at', endDate)
            .order('created_at', { ascending: false }),
          supabase.from('hr_activities_type').select('key, score, label, process_group'),
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
  }, [selectedMonth]);

  const processGroupMap = useMemo(() => {
    return new Map<string, string>(typeRows.map((r) => [r.key, r.process_group || 'other']));
  }, [typeRows]);

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

  const totalSalary = useMemo(() => {
    return activities.reduce((sum, a) => {
      return sum + (a.status === 'accepted' && a.salary ? Number(a.salary) : 0);
    }, 0);
  }, [activities]);

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
                    <p className="text-sm text-muted-foreground">Your account</p>
                    <h1 className="text-3xl font-bold text-foreground">My Activities</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      label=""
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      options={MONTH_OPTIONS}
                    />
                    <Button onClick={fetchAll} variant="outline" disabled={loading || refreshing}>
                      {loading || refreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        label="Search"
                        placeholder="Search activity type"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="min-w-[150px]">
                      <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
                      />
                    </div>
                    <div className="flex items-end gap-4 text-sm flex-wrap">
                      <div className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{activities.length}</span></div>
                      <div className="text-muted-foreground">Pending: <span className="font-semibold text-foreground">{pendingCount}</span></div>
                      <div className="text-muted-foreground">Accepted: <span className="font-semibold text-foreground">{acceptedCount}</span></div>
                      <div className="text-muted-foreground">Denied: <span className="font-semibold text-foreground">{deniedCount}</span></div>
                      <div className="text-muted-foreground">Earned: <span className="font-semibold text-foreground">{totalEarned} pts</span></div>
                      <div className="text-primary font-bold">Monthly Salary: <span className="text-foreground">${totalSalary.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div className="w-full">
                    {loading ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">Loading activities…</div>
                    ) : rows.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <p className="text-lg font-semibold text-foreground">No activities found</p>
                        <p className="text-sm">Submit an activity to see it here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground border-b border-border">
                              <th className="py-2 pr-4 font-medium">Activity Type</th>
                              <th className="py-2 pr-4 font-medium">Process Group</th>
                              <th className="py-2 pr-4 font-medium">Status</th>
                              <th className="py-2 pr-4 font-medium">Points</th>
                              <th className="py-2 pr-4 font-medium">Salary</th>
                              <th className="py-2 pr-4 font-medium">Created</th>
                              <th className="py-2 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {rows.map((activity) => {
                              const points = computePoints(activity);
                              const label = labelMap.get(activity.activity_type);
                              const processGroup = processGroupMap.get(activity.activity_type) || 'other';

                              return (
                                <tr key={activity.id}>
                                  <td className="py-3 pr-4">
                                    <div className="font-medium text-foreground">{label?.trim() ? label : activity.activity_type}</div>
                                    <div className="text-xs text-muted-foreground">{activity.activity_type}</div>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground capitalize">
                                      {processGroup}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4">
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
                                  </td>
                                  <td className="py-3 pr-4 text-foreground">{points.points}</td>
                                  <td className="py-3 pr-4">
                                    {activity.salary ? (
                                      <span className="text-foreground font-medium">${activity.salary.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                                    {new Date(activity.created_at).toLocaleString()}
                                  </td>
                                  <td className="py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewActivity(activity)}
                                      className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                      Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
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
          <p className="text-sm font-semibold text-muted-foreground">Parsed BBCode Preview</p>
          <div className="mt-4 p-4 bg-secondary rounded-md h-[500px]">
            <BbcodePreview html={renderBbcode(activity.bbc_content)} title="BBCode preview" />
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
