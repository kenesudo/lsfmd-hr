'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ProcessGroup = 'application' | 'reinstatement' | 'supervision' | 'trainings' | 'employee_profile' | 'roster_update';

type ProcessRow = {
  key: string;
  process_group: ProcessGroup;
  label: string;
  score: number;
  created_at: string;
};

const GROUP_OPTIONS: { value: ProcessGroup; label: string }[] = [
  { value: 'application', label: 'Application' },
  { value: 'reinstatement', label: 'Reinstatement' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'trainings', label: 'Trainings' },
  { value: 'employee_profile', label: 'Employee Profile' },
  { value: 'roster_update', label: 'Roster Update' },
];

const SCORE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
];

export default function CommanderProcessesPage() {
  const [rows, setRows] = useState<ProcessRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterGroup, setFilterGroup] = useState<ProcessGroup>('application');

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newGroup, setNewGroup] = useState<ProcessGroup>('application');
  const [newScore, setNewScore] = useState('1');
  const [creating, setCreating] = useState(false);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const visibleRows = useMemo(() => {
    return rows
      .filter((r) => r.process_group === filterGroup)
      .slice()
      .sort((a, b) => (a.label || a.key).localeCompare(b.label || b.key) || a.key.localeCompare(b.key));
  }, [rows, filterGroup]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('hr_activities_type')
          .select('key, process_group, label, score, created_at')
          .order('process_group', { ascending: true })
          .order('label', { ascending: true })
          .order('key', { ascending: true });

        if (error) {
          toast.error(error.message || 'Failed to load processes');
          setRows([]);
          return;
        }

        setRows((data ?? []) as ProcessRow[]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateRowLocal = (key: string, patch: Partial<ProcessRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const createProcess = async () => {
    const key = newKey.trim();
    if (!key) {
      toast.error('Key is required');
      return;
    }

    const scoreInt = Number(newScore);
    if (![1, 2, 3].includes(scoreInt)) {
      toast.error('Score must be 1, 2, or 3');
      return;
    }

    setCreating(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('hr_activities_type')
        .insert({
          key,
          label: newLabel.trim(),
          process_group: newGroup,
          score: scoreInt,
        })
        .select('key, process_group, label, score, created_at')
        .single();

      if (error) {
        toast.error(error.message || 'Failed to create process');
        return;
      }

      if (data) {
        setRows((prev) => [...prev, data as ProcessRow]);
      }

      setNewKey('');
      setNewLabel('');
      setNewGroup(filterGroup);
      setNewScore('1');

      toast.success('Process created');
    } finally {
      setCreating(false);
    }
  };

  const saveProcess = async (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;

    if (!row.key.trim()) {
      toast.error('Key is required');
      return;
    }

    if (![1, 2, 3].includes(Number(row.score))) {
      toast.error('Score must be 1, 2, or 3');
      return;
    }

    setSavingKey(key);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('hr_activities_type')
        .update({
          label: row.label,
          process_group: row.process_group,
          score: Number(row.score),
        })
        .eq('key', key);

      if (error) {
        toast.error(error.message || 'Failed to save process');
        return;
      }

      toast.success('Saved');
    } finally {
      setSavingKey(null);
    }
  };

  const deleteProcess = async (key: string) => {
    setDeletingKey(key);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from('hr_activities_type').delete().eq('key', key);

      if (error) {
        toast.error(error.message || 'Failed to delete process');
        return;
      }

      setRows((prev) => prev.filter((r) => r.key !== key));
      toast.success('Deleted');
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Commander tools</p>
            <h1 className="text-2xl font-bold text-foreground">Processes</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Create process</h2>

              <div className="space-y-4">
                <Input
                  label="Key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. application_pending_interview"
                />

                <Input
                  label="Label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Human readable label"
                />

                <Select
                  label="Group"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as ProcessGroup)}
                  options={GROUP_OPTIONS}
                />

                <Select
                  label="Score (required)"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  options={SCORE_OPTIONS}
                />

                <Button type="button" onClick={createProcess} disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>

                <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  Score must be 1–3. This is used by dashboard scoring.
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h2 className="text-lg font-semibold text-foreground">Existing processes</h2>
                <div className="w-[260px]">
                  <Select
                    label="Filter by group"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value as ProcessGroup)}
                    options={GROUP_OPTIONS}
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : visibleRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No processes found for this group.</p>
              ) : (
                <div className="space-y-3">
                  {visibleRows.map((r) => {
                    const saving = savingKey === r.key;
                    const deleting = deletingKey === r.key;
                    return (
                      <div key={r.key} className="rounded-md border border-border bg-background p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <Input label="Key" value={r.key} disabled />
                          </div>

                          <div className="md:col-span-4">
                            <Input
                              label="Label"
                              value={r.label}
                              onChange={(e) => updateRowLocal(r.key, { label: e.target.value })}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Select
                              label="Group"
                              value={r.process_group}
                              onChange={(e) => updateRowLocal(r.key, { process_group: e.target.value as ProcessGroup })}
                              options={GROUP_OPTIONS}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Select
                              label="Score"
                              value={String(r.score)}
                              onChange={(e) => updateRowLocal(r.key, { score: Number(e.target.value) })}
                              options={SCORE_OPTIONS}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3 flex-wrap">
                          <Button type="button" onClick={() => saveProcess(r.key)} disabled={saving || deleting}>
                            {saving ? 'Saving…' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteProcess(r.key)}
                            disabled={saving || deleting}
                          >
                            {deleting ? 'Deleting…' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
