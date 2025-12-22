'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type ProcessTypeOption } from '@/components/DynamicBbcTemplateRunner';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';
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

export default function ReinstatementPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoFillHr, setAutoFillHr] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [processTypeOptions, setProcessTypeOptions] = useState<ProcessTypeOption[]>([]);
  const [processTypeOptionsLoading, setProcessTypeOptionsLoading] = useState(false);
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [saving, setSaving] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [logMarkdown, setLogMarkdown] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  const lastLogProcessTypeRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, hr_rank')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadProcessOptions = async () => {
      setProcessTypeOptionsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('hr_activities_type')
          .select('key, label')
          .eq('process_group', 'reinstatement')
          .order('label', { ascending: true })
          .order('key', { ascending: true });

        if (error) {
          toast.error(error.message || 'Failed to load process options');
          setProcessTypeOptions([]);
          setSelectedStatus('');
          return;
        }

        const options: ProcessTypeOption[] = (data ?? []).map((row) => ({
          value: row.key,
          label: row.label?.trim() ? row.label : row.key,
        }));

        setProcessTypeOptions(options);
        setSelectedStatus((prev) => {
          if (prev && options.some((o) => o.value === prev)) return prev;
          return options[0]?.value ?? '';
        });
      } finally {
        setProcessTypeOptionsLoading(false);
      }
    };

    loadProcessOptions();
  }, []);

  useEffect(() => {
    const fetchLogMarkdown = async () => {
      if (!selectedStatus) {
        lastLogProcessTypeRef.current = null;
        setLogMarkdown('');
        return;
      }

      if (lastLogProcessTypeRef.current === selectedStatus) return;
      lastLogProcessTypeRef.current = selectedStatus;

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

  useEffect(() => {
    setLogCopied(false);
  }, [selectedStatus]);

  const handleCopyLog = async () => {
    if (!logMarkdown) {
      toast.error('No log markdown available for this status');
      return;
    }
    try {
      await navigator.clipboard.writeText(logMarkdown);
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
      toast.success('Log copied');
    } catch {
      toast.error('Failed to copy log');
    }
  };

  const providedValues: Record<string, string> | undefined = autoFillHr
    ? {
        hr_rank: profile?.hr_rank ?? '',
        hr_name: profile?.full_name ?? '',
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-8">Reinstatement Templates</h1>

              <div className="mb-4">
                <Checkbox
                  label="Auto-fill HR name/rank"
                  checked={autoFillHr}
                  onChange={(e) => setAutoFillHr(e.target.checked)}
                />
              </div>

              <DynamicBbcTemplateRunner
                title="Input Details"
                description="Fill the inputs below. Fields are defined in the BBC Templates editor."
                initialProcessType={selectedStatus}
                processTypeLabel="Reinstatement Status"
                processTypeOptions={processTypeOptions}
                providedValues={providedValues}
                onProcessTypeChange={(processType) => setSelectedStatus(processType)}
                onGeneratedChange={(bbc) => setGeneratedBBC(bbc)}
                primaryActionLabel={saving ? 'Saving…' : 'Save Activity'}
                onPrimaryAction={async ({ generatedBBC }) => {
                  setSaving(true);
                  try {
                    const supabase = createSupabaseBrowserClient();
                    const { data: { user } } = await supabase.auth.getUser();

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
                      toast.error(error.message || 'Failed to save activity');
                      return;
                    }

                    toast.success('Saved successfully');
                    setLogCopied(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              <div className="mt-6 bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Logging Section</h2>

                <Button onClick={handleCopyLog} className="w-full" disabled={logLoading || !logMarkdown}>
                  {logCopied ? '✓ Copied!' : 'Copy Log Markdown'}
                </Button>

                <div className="mt-3 p-3 bg-secondary rounded-md">
                  {logLoading ? (
                    <p className="text-sm text-muted-foreground">Loading log markdown…</p>
                  ) : logMarkdown ? (
                    <div
                      className="text-sm text-foreground overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(logMarkdown) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No markdown found for this status.</p>
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
