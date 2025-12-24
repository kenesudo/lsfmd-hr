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

export default function RosterUpdatePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoFillHr, setAutoFillHr] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processType, setProcessType] = useState('');
  const [processTypeOptions, setProcessTypeOptions] = useState<ProcessTypeOption[]>([]);

  const [logCopied, setLogCopied] = useState(false);
  const [logMarkdown, setLogMarkdown] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  const lastLogProcessTypeRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, hr_rank')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadProcessOptions = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('hr_activities_type')
          .select('key, label')
          .eq('process_group', 'roster_update')
          .order('label');

        if (error) {
          toast.error(error.message);
          setProcessTypeOptions([]);
          setProcessType('');
          return;
        }

        const options: ProcessTypeOption[] = (data ?? []).map((row: any) => ({
          value: row.key as string,
          label: typeof row.label === 'string' && row.label.trim() ? (row.label as string) : (row.key as string),
        }));

        setProcessTypeOptions(options);
        setProcessType((prev) => {
          if (prev && options.some((o) => o.value === prev)) return prev;
          return options[0]?.value ?? '';
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load process options');
        setProcessTypeOptions([]);
        setProcessType('');
      }
    };

    loadProcessOptions();
  }, []);

  const providedValues: Record<string, string> | undefined = autoFillHr
    ? {
        hr_rank: profile?.hr_rank ?? '',
        hr_name: profile?.full_name ?? '',
      }
    : undefined;

  useEffect(() => {
    setLogCopied(false);
    const fetchLogMarkdown = async () => {
      if (!processType) {
        lastLogProcessTypeRef.current = null;
        setLogMarkdown('');
        return;
      }

      if (lastLogProcessTypeRef.current === processType) return;
      lastLogProcessTypeRef.current = processType;

      setLogLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('log_markdowns')
          .select('content')
          .eq('process_type', processType)
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
  }, [processType]);

  const handleCopyLog = async () => {
    if (!logMarkdown) {
      toast.error('No log markdown available for this tab');
      return;
    }

    try {
      await navigator.clipboard.writeText(logMarkdown);
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
      toast.success('Log markdown copied');
    } catch {
      toast.error('Failed to copy log markdown');
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
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Roster Update</h1>
                  <p className="text-muted-foreground">Track roster updates as activities.</p>
                </div>
              </div>

              <div>
                <Checkbox
                  label="Auto-fill HR name/rank"
                  checked={autoFillHr}
                  onChange={(e) => setAutoFillHr(e.target.checked)}
                />
              </div>

              <DynamicBbcTemplateRunner
                title="Roster Update"
                description="Fill the inputs below. If a {{variable}} exists in the template, it must have a field definition in the BBCode Templates editor."
                initialProcessType={processType}
                processTypeLabel="Process"
                processTypeOptions={processTypeOptions}
                providedValues={providedValues}
                onProcessTypeChange={(pt) => setProcessType(pt)}
                primaryActionLabel={saving ? 'Saving…' : 'Save Activity'}
                onPrimaryAction={async ({ generatedBBC }) => {
                  setSaving(true);
                  try {
                    const supabase = createSupabaseBrowserClient();
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) {
                      toast.error('You are not signed in.');
                      return;
                    }

                    const { error } = await supabase.from('hr_activities').insert({
                      hr_id: user.id,
                      bbc_content: generatedBBC,
                      activity_type: processType,
                    });

                    if (error) {
                      toast.error(error.message);
                      return;
                    }

                    toast.success('Roster update activity saved successfully');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to save activity');
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              {logMarkdown && (
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Log Markdown</h2>
                    <Button variant="outline" size="sm" onClick={handleCopyLog} disabled={logLoading}>
                      {logCopied ? 'Copied!' : 'Copy Log'}
                    </Button>
                  </div>
                  {logLoading ? (
                    <div className="text-sm text-muted-foreground">Loading log markdown…</div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(logMarkdown) }}
                    />
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
