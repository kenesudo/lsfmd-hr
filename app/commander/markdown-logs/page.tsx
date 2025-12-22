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

type ProcessType =
  | 'application_on_hold'
  | 'application_hired'
  | 'application_blacklisted'
  | 'application_closed'
  | 'application_denied'
  | 'application_pending_interview'
  | 'application_pending_badge'
  | 'reinstatement_on_hold'
  | 'reinstatement_denied'
  | 'reinstatement_exam_failed'
  | 'reinstatement_pending_exam'
  | 'reinstatement_pending_recommendations'
  | 'reinstatement_pending_badge'
  | 'training_orientation'
  | 'training_practical'
  | 'training_exam'
  | 'training_tf_creation'
  | 'training_tf_closure'
  | 'lr_interview'
  | 'supervision';

type LogRow = {
  id: string;
  process_type: ProcessType;
  content: string;
  created_at: string;
};

const PROCESS_OPTIONS: { value: ProcessType; label: string }[] = [
  { value: 'application_pending_interview', label: 'Application - Pending Interview' },
  { value: 'application_pending_badge', label: 'Application - Pending Badge' },
  { value: 'application_hired', label: 'Application - Hired' },
  { value: 'application_on_hold', label: 'Application - On Hold' },
  { value: 'application_closed', label: 'Application - Closed' },
  { value: 'application_denied', label: 'Application - Denied' },
  { value: 'application_blacklisted', label: 'Application - Blacklisted' },

  { value: 'reinstatement_on_hold', label: 'Reinstatement - On Hold' },
  { value: 'reinstatement_pending_recommendations', label: 'Reinstatement - Pending Recommendations' },
  { value: 'reinstatement_pending_exam', label: 'Reinstatement - Pending Exam' },
  { value: 'reinstatement_pending_badge', label: 'Reinstatement - Pending Badge' },
  { value: 'reinstatement_exam_failed', label: 'Reinstatement - Exam Failed' },
  { value: 'reinstatement_denied', label: 'Reinstatement - Denied' },
  { value: 'training_orientation', label: 'Training - Orientation' },
  { value: 'training_practical', label: 'Training - Practical' },
  { value: 'training_exam', label: 'Training - Exam' },
  { value: 'training_tf_creation', label: 'Training File - Creation' },
  { value: 'training_tf_closure', label: 'Training File - Closure' },
  { value: 'lr_interview', label: 'LR Interview' },
  { value: 'supervision', label: 'Supervision' },
];

export default function CommanderMarkdownLogsPage() {
  const [processType, setProcessType] = useState<ProcessType>('application_pending_interview');
  const [rows, setRows] = useState<LogRow[]>([]);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const row = useMemo(() => rows.find((r) => r.process_type === processType) ?? null, [rows, processType]);

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
                  label="Process Type"
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value as ProcessType)}
                  options={PROCESS_OPTIONS}
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
