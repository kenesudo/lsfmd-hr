'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type StatusOption } from '@/components/DynamicBbcTemplateRunner';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type TrainingStatus = 'creation' | 'training' | 'exam' | 'close' | 'reopen';

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'creation', label: 'Creation' },
  { value: 'training', label: 'Training' },
  { value: 'exam', label: 'Exam' },
  { value: 'close', label: 'Close' },
  { value: 'reopen', label: 'Reopen' },
];

export default function TrainingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoFillHr, setAutoFillHr] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState<TrainingStatus>('creation');

  const [generatedBBC, setGeneratedBBC] = useState('');
  const [saving, setSaving] = useState(false);

  const [logCopied, setLogCopied] = useState(false);
  const [tfLogCopied, setTfLogCopied] = useState(false);

  const trainingLogMarkdown = `**Task Performed: Orientation / Practical Training / Exam:**\n**Trainee's Name:**\n**Trainee's Training File:**`;
  const tfLogMarkdown = `**Task Performed::** TF Creation/TF Closure\n**Trainee's Name:**\n**Trainee's Training File:**`;

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

  const handleCopyTrainingLog = async () => {
    try {
      await navigator.clipboard.writeText(trainingLogMarkdown);
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
      toast.success('Log copied');
    } catch {
      toast.error('Failed to copy log');
    }
  };

  const handleCopyTfLog = async () => {
    try {
      await navigator.clipboard.writeText(tfLogMarkdown);
      setTfLogCopied(true);
      setTimeout(() => setTfLogCopied(false), 2000);
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
              <h1 className="text-3xl font-bold text-foreground mb-8">Trainings</h1>

              <div className="mb-4">
                <Checkbox
                  label="Auto-fill HR name/rank"
                  checked={autoFillHr}
                  onChange={(e) => setAutoFillHr(e.target.checked)}
                />
              </div>

              <DynamicBbcTemplateRunner
                templateGroup="trainings"
                title="Inputs"
                description="Fields are defined in the BBC Templates editor."
                initialStatus={selectedStatus}
                statusLabel="Status"
                statusOptions={STATUS_OPTIONS}
                providedValues={providedValues}
                onStatusChange={(status) => setSelectedStatus(status as TrainingStatus)}
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

                    const activityType =
                      selectedStatus === 'close'
                        ? 'training_file_closure'
                        : selectedStatus === 'creation' || selectedStatus === 'reopen'
                          ? 'training_file_creation'
                          : 'training';

                    const { error } = await supabase.from('hr_activities').insert({
                      hr_id: user.id,
                      bbc_content: generatedBBC,
                      activity_type: activityType,
                    });

                    if (error) {
                      toast.error(error.message || 'Failed to save activity');
                      return;
                    }

                    toast.success('Saved successfully');
                    setLogCopied(false);
                    setTfLogCopied(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              <div className="mt-6 bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Logging Section</h2>

                {generatedBBC ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={handleCopyTrainingLog} className="flex-1">
                        {logCopied ? '✓ Copied!' : 'Copy Log'}
                      </Button>
                      <Button onClick={handleCopyTfLog} className="flex-1" variant="outline">
                        {tfLogCopied ? '✓ Copied!' : 'Copy TF Log'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary rounded-md">
                        <div className="text-sm text-foreground overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{trainingLogMarkdown}</pre>
                        </div>
                      </div>
                      <div className="p-3 bg-secondary rounded-md">
                        <div className="text-sm text-foreground overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{tfLogMarkdown}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Generate a template to show the log markdown.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                  <div className="rounded-md border border-border bg-secondary px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Reopen templates are optional. If you add one later, it will appear automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
