'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type ProcessTypeOption } from '@/components/DynamicBbcTemplateRunner';
import Sidebar from '@/components/Sidebar';
import { PROCESS_LABELS, type ProcessType } from '@/lib/hrProcesses';
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
  // Bold **text**
  s = s.replaceAll(/\*\*([^\n*]+)\*\*/g, '<strong>$1</strong>');
  // Auto-link URLs
  s = s.replaceAll(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer" style="text-decoration:underline">$1</a>');
  // Newlines
  s = s.replaceAll(/\r\n|\r|\n/g, '<br />');
  return s;
}

interface UserProfile {
  full_name: string;
  hr_rank: string;
}

type ApplicationStatus =
  | 'application_pending_interview'
  | 'application_pending_badge'
  | 'application_hired'
  | 'application_on_hold'
  | 'application_closed'
  | 'application_denied'
  | 'application_blacklisted';

export default function ApplicationsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [autoFillHr, setAutoFillHr] = useState(true);
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('application_pending_interview');
  const [saving, setSaving] = useState(false);

  const [logCopied, setLogCopied] = useState(false);
  const [interviewLogCopied, setInterviewLogCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createSupabaseBrowserClient();
      
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, hr_rank')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    fetchData();
  }, []);

  const processTypeOptions: ProcessTypeOption[] = [
    { value: 'application_pending_interview', label: PROCESS_LABELS.get('application_pending_interview' as ProcessType) ?? 'Application - Pending Interview' },
    { value: 'application_pending_badge', label: PROCESS_LABELS.get('application_pending_badge' as ProcessType) ?? 'Application - Pending Badge' },
    { value: 'application_hired', label: PROCESS_LABELS.get('application_hired' as ProcessType) ?? 'Application - Hired' },
    { value: 'application_on_hold', label: PROCESS_LABELS.get('application_on_hold' as ProcessType) ?? 'Application - On Hold' },
    { value: 'application_closed', label: PROCESS_LABELS.get('application_closed' as ProcessType) ?? 'Application - Closed' },
    { value: 'application_denied', label: PROCESS_LABELS.get('application_denied' as ProcessType) ?? 'Application - Denied' },
    { value: 'application_blacklisted', label: PROCESS_LABELS.get('application_blacklisted' as ProcessType) ?? 'Application - Blacklisted' },
  ];

  const showInterviewLog = selectedStatus === 'application_pending_interview';

  const logMarkdown = `**Application/Reinstatement: Response / Review**\n**Application Link:**\n**Status:**`;
  const interviewLogMarkdown = `Interview\n**Applicant Name:**\n**Application Link:**\n**Screenshot:**\n**Status:**`;

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(logMarkdown);
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
      toast.success('Log copied');
    } catch {
      toast.error('Failed to copy log');
    }
  };

  const handleCopyInterviewLog = async () => {
    try {
      await navigator.clipboard.writeText(interviewLogMarkdown);
      setInterviewLogCopied(true);
      setTimeout(() => setInterviewLogCopied(false), 2000);
      toast.success('Interview log copied');
    } catch {
      toast.error('Failed to copy interview log');
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
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              Application Template Generator
            </h1>

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
              processTypeLabel="Application Status"
              processTypeOptions={processTypeOptions}
              providedValues={providedValues}
              onProcessTypeChange={(processType) => setSelectedStatus(processType as ApplicationStatus)}
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
                    toast.error(error.message || 'Failed to save activity');
                    return;
                  }

                  toast.success('Saved successfully');
                  setLogCopied(false);
                  setInterviewLogCopied(false);
                } finally {
                  setSaving(false);
                }
              }}
            />

            <div className="mt-6 bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Logging Section</h2>

              {generatedBBC ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button onClick={handleCopyLog} className="w-full">
                        {logCopied ? '✓ Copied!' : 'Copy Log'}
                      </Button>
                    </div>

                    <div className="p-3 bg-secondary rounded-md">
                      <div
                        className="text-sm text-foreground overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(logMarkdown) }}
                      />
                    </div>
                  </div>

                  {showInterviewLog && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button onClick={handleCopyInterviewLog} className="w-full" variant="outline">
                          {interviewLogCopied ? '✓ Copied!' : 'Copy Interview Log'}
                        </Button>
                      </div>

                      <div className="p-3 bg-secondary rounded-md">
                        <div
                          className="text-sm text-foreground overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(interviewLogMarkdown) }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Generate a template to show the log markdown.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
