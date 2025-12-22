'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type StatusOption } from '@/components/DynamicBbcTemplateRunner';
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

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type ReinstatementStatus =
  | 'reinstatement_on_hold'
  | 'reinstatement_pending_recommendations'
  | 'reinstatement_pending_exam'
  | 'reinstatement_pending_badge'
  | 'reinstatement_exam_failed'
  | 'reinstatement_denied';

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'reinstatement_on_hold',
    label: PROCESS_LABELS.get('reinstatement_on_hold' as ProcessType) ?? 'Reinstatement - On Hold',
  },
  {
    value: 'reinstatement_pending_recommendations',
    label:
      PROCESS_LABELS.get('reinstatement_pending_recommendations' as ProcessType) ??
      'Reinstatement - Pending Recommendations',
  },
  {
    value: 'reinstatement_pending_exam',
    label: PROCESS_LABELS.get('reinstatement_pending_exam' as ProcessType) ?? 'Reinstatement - Pending Exam',
  },
  {
    value: 'reinstatement_pending_badge',
    label: PROCESS_LABELS.get('reinstatement_pending_badge' as ProcessType) ?? 'Reinstatement - Pending Badge',
  },
  {
    value: 'reinstatement_exam_failed',
    label: PROCESS_LABELS.get('reinstatement_exam_failed' as ProcessType) ?? 'Reinstatement - Exam Failed',
  },
  {
    value: 'reinstatement_denied',
    label: PROCESS_LABELS.get('reinstatement_denied' as ProcessType) ?? 'Reinstatement - Denied',
  },
];

export default function ReinstatementPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoFillHr, setAutoFillHr] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReinstatementStatus>('reinstatement_on_hold');
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [saving, setSaving] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [interviewLogCopied, setInterviewLogCopied] = useState(false);

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

  const logMarkdown = `**Reinstatement: Response / Review**\n**Application Link:**\n**Status:**`;
  const interviewLogMarkdown = `Interview\n**Applicant Name:**\n**Application Link:**\n**Screenshot:**\n**Status:**`;

  const showInterviewLog = selectedStatus === 'reinstatement_pending_exam';

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
                templateGroup="reinstatement"
                title="Inputs"
                description="Fields are defined in the BBC Templates editor."
                initialStatus={selectedStatus}
                statusLabel="Status"
                statusOptions={STATUS_OPTIONS}
                providedValues={providedValues}
                onStatusChange={(status) => setSelectedStatus(status as ReinstatementStatus)}
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
                        <div className="text-sm text-foreground overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{logMarkdown}</pre>
                        </div>
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
                          <div className="text-sm text-foreground overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{interviewLogMarkdown}</pre>
                          </div>
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
    </div>
  );
}
