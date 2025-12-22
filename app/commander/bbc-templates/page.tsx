'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type TemplateGroup =
  | 'application'
  | 'reinstatement'
  | 'trainings'
  | 'employee_profile_creation'
  | 'employee_profile_update'
  | 'supervision';

type TemplateRow = {
  id: string;
  status: string;
  template_code: string;
};

const GROUP_OPTIONS: { value: TemplateGroup; label: string }[] = [
  { value: 'application', label: 'Applications' },
  { value: 'reinstatement', label: 'Reinstatements' },
  { value: 'trainings', label: 'Trainings' },
  { value: 'employee_profile_creation', label: 'Employee Profile (Creation)' },
  { value: 'employee_profile_update', label: 'Employee Profile (Update)' },
  { value: 'supervision', label: 'Supervisions' },
];

export default function CommanderBBCTemplatesPage() {
  const [group, setGroup] = useState<TemplateGroup>('application');
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('bbc_templates')
          .select('id,status,template_code')
          .eq('template_group', group)
          .order('status');
        if (error) {
          toast.error(error.message || 'Failed to load templates');
          setRows([]);
          setSelectedId('');
          setDraft('');
          return;
        }
        const list = (data ?? []) as TemplateRow[];
        setRows(list);
        const first = list[0]?.id ?? '';
        setSelectedId(first);
        setDraft(list.find((r) => r.id === first)?.template_code ?? '');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [group]);

  useEffect(() => {
    if (!selectedRow) {
      setDraft('');
      return;
    }
    setDraft(selectedRow.template_code);
  }, [selectedRow?.id]);

  const handleSave = async () => {
    if (!selectedRow) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('bbc_templates')
        .update({ template_code: draft })
        .eq('id', selectedRow.id);

      if (error) {
        toast.error(error.message || 'Failed to save template');
        return;
      }

      setRows((prev) => prev.map((r) => (r.id === selectedRow.id ? { ...r, template_code: draft } : r)));
      toast.success('Saved');
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
            <h1 className="text-2xl font-bold text-foreground">BBC Templates Editor</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
              <div className="space-y-4">
                <Select
                  label="Process"
                  value={group}
                  onChange={(e) => setGroup(e.target.value as TemplateGroup)}
                  options={GROUP_OPTIONS}
                />

                <Select
                  label="Status"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  options={rows.map((r) => ({ value: r.id, label: r.status }))}
                />

                {loading && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
              <Textarea
                label="Template Code"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[420px] font-mono"
                placeholder="Template code"
                disabled={!selectedRow}
              />

              <div className="mt-4 flex gap-3">
                <Button onClick={handleSave} disabled={!selectedRow || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDraft(selectedRow?.template_code ?? '')}
                  disabled={!selectedRow || saving}
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
