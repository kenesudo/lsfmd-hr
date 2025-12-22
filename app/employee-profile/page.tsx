'use client';

import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import DynamicBbcTemplateRunner, { type ProcessTypeOption } from '@/components/DynamicBbcTemplateRunner';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type ActiveTab = 'creation' | 'update';

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('creation');
  const [autoFillHr, setAutoFillHr] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be signed in to view this page.');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, hr_rank')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) setProfile(profileData as UserProfile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load employee profile data.');
      }
    };

    fetchData();
  }, []);
  const providedValues: Record<string, string> | undefined = autoFillHr
    ? {
        hr_rank: profile?.hr_rank ?? '',
        hr_name: profile?.full_name ?? '',
      }
    : undefined;

  const processType = activeTab === 'creation' ? 'employee_profile_creation' : 'employee_profile_update';
  const title = activeTab === 'creation' ? 'Profile Creation' : 'Update Logs';

  const processTypeOptions: ProcessTypeOption[] = [
    { value: processType, label: title },
  ];

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
                  <h1 className="text-3xl font-bold text-foreground">Employee Profiles</h1>
                  <p className="text-muted-foreground">Fields are defined in the BBC Templates editor.</p>
                </div>
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveTab('creation')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'creation'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Profile Creation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('update')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'update' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Update Logs
                  </button>
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
                title={title}
                description="Fill the inputs below. If a {{variable}} exists in the template, it must have a field definition in the editor."
                initialProcessType={processType}
                processTypeOptions={processTypeOptions}
                providedValues={providedValues}
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
                      toast.error(error.message || 'Failed to save activity');
                      return;
                    }

                    toast.success('Saved');
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
