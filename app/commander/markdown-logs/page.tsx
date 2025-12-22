'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ProcessGroup = 'application' | 'reinstatement' | 'supervision' | 'trainings' | 'employee_profile';

type LogRow = {
  id: string;
  process_type: string;
  content: string;
  created_at: string;
};

const GROUP_OPTIONS: { value: ProcessGroup; label: string }[] = [
  { value: 'application', label: 'Application' },
  { value: 'reinstatement', label: 'Reinstatement' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'trainings', label: 'Trainings' },
  { value: 'employee_profile', label: 'Employee Profile' },
];

export default function CommanderMarkdownLogsPage() {
  const [processGroup, setProcessGroup] = useState<ProcessGroup>('application');
  const [processType, setProcessType] = useState('');
  const [processTypeOptions, setProcessTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [rows, setRows] = useState<LogRow[]>([]);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const row = useMemo(() => rows.find((r) => r.process_type === processType) ?? null, [rows, processType]);

  useEffect(() => {
    const loadProcessOptions = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('hr_activities_type')
          .select('key, label')
          .eq('process_group', processGroup)
          .order('label', { ascending: true })
          .order('key', { ascending: true });

        if (error) {
          toast.error(error.message || 'Failed to load process options');
          setProcessTypeOptions([]);
          setProcessType('');
          return;
        }

        const options = (data ?? []).map((r: any) => ({
          value: r.key as string,
          label: (typeof r.label === 'string' && r.label.trim() ? r.label : r.key) as string,
        }));

        setProcessTypeOptions(options);
        setProcessType((prev) => {
          if (prev && options.some((o) => o.value === prev)) return prev;
          return options[0]?.value ?? '';
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load process options');
        setProcessTypeOptions([]);
        setProcessType('');
      }
    };

    loadProcessOptions();
  }, [processGroup]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('log_markdowns')
          .select('id, process_type, content, created_at')
          .order('process_type');

        if (error) {
          toast.error(error.message || 'Failed to load log templates');
          setRows([]);
          setContent('');
          return;
        }

        const list = (data ?? []) as LogRow[];
        setRows(list);
        setContent(list.find((r) => r.process_type === processType)?.content ?? '');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setContent(row?.content ?? '');
  }, [row?.id, processType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (row) {
        const { error } = await supabase
          .from('log_markdowns')
          .update({ content })
          .eq('process_type', processType);

        if (error) {
          toast.error(error.message || 'Failed to save');
          return;
        }

        setRows((prev) => prev.map((r) => (r.process_type === processType ? { ...r, content } : r)));
        toast.success('Saved');
        return;
      }

      const { data, error } = await supabase
        .from('log_markdowns')
        .insert({ process_type: processType, content })
        .select('id, process_type, content, created_at')
        .single();

      if (error) {
        toast.error(error.message || 'Failed to create');
        return;
      }

      if (data) {
        setRows((prev) => [...prev, data as LogRow]);
      }

      toast.success('Created');
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold text-foreground">Markdown Logs Editor</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
              <div className="space-y-4">
                <Select
                  label="Process Group"
                  value={processGroup}
                  onChange={(e) => setProcessGroup(e.target.value as ProcessGroup)}
                  options={GROUP_OPTIONS}
                />

                <Select
                  label="Process Type"
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
                  options={processTypeOptions}
                />

                <Input
                  label="Current Row Id"
                  value={row?.id ?? ''}
                  disabled
                  placeholder="(not created yet)"
                />

                {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
                {!loading && !row && (
                  <p className="text-sm text-muted-foreground">
                    No row yet for this process type. Enter content and click Save to create it.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
              <Textarea
                label="Markdown Template"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[420px] font-mono"
                placeholder="Enter canonical markdown for this process type"
              />

              <div className="mt-4 flex gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : row ? 'Save' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setContent(row?.content ?? '')}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
