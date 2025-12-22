'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type ProcessTypeOption } from '@/components/DynamicBbcTemplateRunner';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function markdownToHtml(markdown: string) {
  let s = escapeHtml(markdown);
  s = s.replaceAll(/\*\*([^\n*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replaceAll(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer" style="text-decoration:underline">$1</a>');
  s = s.replaceAll(/\r\n|\r|\n/g, '<br />');
  return s;
}

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type SupervisionStatus =
  | 'supervision'
  | 'supervision_interview'
  | 'supervision_orentation'
  | 'supervision_practical'
  | 'supervision_reinstatement_exam'
  | 'supervision_exam';

const PROCESS_TYPE_OPTIONS: ProcessTypeOption[] = [
  { value: 'supervision', label: 'General' },
  { value: 'supervision_interview', label: 'Interview' },
  { value: 'supervision_orentation', label: 'Orentation' },
  { value: 'supervision_practical', label: 'Practical' },
  { value: 'supervision_reinstatement_exam', label: 'Reinstatement Exam' },
  { value: 'supervision_exam', label: 'Exam' },
];

export default function SupervisionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoFillHr, setAutoFillHr] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<SupervisionStatus>('supervision');
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logMarkdown, setLogMarkdown] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const [{ data: authData }, { data: profileData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles').select('id, full_name, hr_rank').maybeSingle(),
      ]);

      if (!authData.user) {
        toast.error('You must be signed in to use supervision tools.');
        return;
      }

      if (profileData) {
        setProfile(profileData as UserProfile);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const fetchLogMarkdown = async () => {
      setLogLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('log_markdowns')
          .select('content')
          .eq('process_type', selectedStatus)
          .maybeSingle();

        if (error) throw error;
        setLogMarkdown(data?.content ?? '');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load log markdown');
        setLogMarkdown('');
      } finally {
        setLogLoading(false);
      }
    };

    fetchLogMarkdown();
  }, [selectedStatus]);

  const handleCopyLog = async () => {
    if (!logMarkdown) {
      toast.error('No log markdown available for this session type');
      return;
    }

    try {
      await navigator.clipboard.writeText(logMarkdown);
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
      toast.success('Log markdown copied');
    } catch {
      toast.error('Failed to copy log markdown');
    }
  };

  const providedValues: Record<string, string> | undefined = autoFillHr
    ? {
        hr_rank: profile?.hr_rank ?? '',
        hr_name: profile?.full_name ?? '',
      }
    : undefined;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Supervisor tools</p>
                <h1 className="text-3xl font-bold text-foreground">Supervision Templates</h1>
              </div>
            </div>

            <div className="mb-4">
              <Checkbox
                label="Auto-fill HR name/rank"
                checked={autoFillHr}
                onChange={(e) => setAutoFillHr(e.target.checked)}
              />
            </div>

            <DynamicBbcTemplateRunner
              title="Session Details"
              description="Fill the inputs below. Fields are defined in the BBC Templates editor."
              initialProcessType={selectedStatus}
              processTypeLabel="Session Type"
              processTypeOptions={PROCESS_TYPE_OPTIONS}
              providedValues={providedValues}
              onProcessTypeChange={(processType) => setSelectedStatus(processType as SupervisionStatus)}
              onGeneratedChange={(bbc) => setGeneratedBBC(bbc)}
              primaryActionLabel={saving ? 'Saving…' : 'Save Activity'}
              onPrimaryAction={async ({ generatedBBC }) => {
                setSaving(true);
                try {
                  const supabase = createSupabaseBrowserClient();
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();

                  if (!user) {
                    toast.error('You are not signed in');
                    return;
                  }

                  const { error } = await supabase.from('hr_activities').insert({
                    hr_id: user.id,
                    bbc_content: generatedBBC,
                    activity_type: selectedStatus,
                  });

                  if (error) {
                    toast.error(error.message || 'Failed to save supervision activity');
                    return;
                  }

                  toast.success('Supervision activity saved');
                  setCopiedLog(false);
                } catch {
                  toast.error('Failed to save supervision activity');
                } finally {
                  setSaving(false);
                }
              }}
            />

            <div className="mt-6 bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Log Markdown</h2>
              <Button onClick={handleCopyLog} variant="outline" className="w-full" disabled={logLoading || !logMarkdown}>
                {copiedLog ? '✓ Copied!' : 'Copy Log Markdown'}
              </Button>
              <div className="mt-3 p-3 bg-secondary rounded-md">
                {logLoading ? (
                  <p className="text-sm text-muted-foreground">Loading log markdown…</p>
                ) : logMarkdown ? (
                  <div
                    className="text-sm text-foreground whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(logMarkdown) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No markdown found for this session type.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
