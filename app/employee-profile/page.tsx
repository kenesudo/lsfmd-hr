'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { renderBbcode } from '@/lib/bbcode';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return result.replace(regex, value);
  }, template);
}

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type BBCTemplate = {
  id: string;
  status: string;
  template_code: string;
};

type ActiveTab = 'creation' | 'update';

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creationTemplate, setCreationTemplate] = useState<BBCTemplate | null>(null);
  const [updateTemplate, setUpdateTemplate] = useState<BBCTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('creation');

  const [employeeName, setEmployeeName] = useState('');
  const [departmentRank, setDepartmentRank] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [divisionAssignment, setDivisionAssignment] = useState('');
  const [dateOfEmployment, setDateOfEmployment] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [awards, setAwards] = useState('');
  const [ribbonRack, setRibbonRack] = useState('');
  const [disciplinaryRecord, setDisciplinaryRecord] = useState('');
  const [previousName, setPreviousName] = useState('');
  const [discord, setDiscord] = useState('');
  const [timezone, setTimezone] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');

  const [updatedInformation, setUpdatedInformation] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');

  const [creationCopied, setCreationCopied] = useState(false);
  const [updateCopied, setUpdateCopied] = useState(false);
  const [savingCreation, setSavingCreation] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);

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

        const { data: creationData, error: creationError } = await supabase
          .from('employee_profile_bbc_templates')
          .select('id, status, template_code')
          .order('created_at', { ascending: true });

        if (creationError) throw creationError;
        setCreationTemplate(creationData?.[0] ?? null);

        const { data: updateData, error: updateError } = await supabase
          .from('employee_profile_update_log_templates')
          .select('id, status, template_code')
          .order('created_at', { ascending: true });

        if (updateError) throw updateError;
        setUpdateTemplate(updateData?.[0] ?? null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load employee profile data.');
      }
    };

    fetchData();
  }, []);

  const creationBBC = useMemo(() => {
    if (!creationTemplate) return '';

    return fillTemplate(creationTemplate.template_code, {
      employee_name: employeeName || 'ANSWER HERE',
      department_rank: departmentRank || 'ANSWER HERE',
      badge_number: badgeNumber || 'N/A',
      division_assignment: divisionAssignment || 'N/A',
      date_of_employment: dateOfEmployment || 'N/A',
      application_link: applicationLink || '**Attachment**',
      awards: awards || '- [I]Award Name[/I] — [I]Date Issued[/I]',
      ribbon_rack: ribbonRack || '**Attachment**',
      disciplinary_record: disciplinaryRecord || '- [I]None on file[/I]',
      previous_name: previousName || 'N/A',
      discord: discord || 'N/A',
      timezone: timezone || 'N/A',
      country_of_residence: countryOfResidence || 'N/A',
    });
  }, [
    creationTemplate,
    employeeName,
    departmentRank,
    badgeNumber,
    divisionAssignment,
    dateOfEmployment,
    applicationLink,
    awards,
    ribbonRack,
    disciplinaryRecord,
    previousName,
    discord,
    timezone,
    countryOfResidence,
  ]);

  const updateBBC = useMemo(() => {
    if (!updateTemplate) return '';

    return fillTemplate(updateTemplate.template_code, {
      hr_name: profile?.full_name || 'HR Representative',
      updated_information: updatedInformation || 'N/A',
      approved_by: approvedBy || profile?.full_name || 'N/A',
      additional_information: additionalInformation || 'N/A',
    });
  }, [updateTemplate, profile?.full_name, updatedInformation, approvedBy, additionalInformation]);

  const creationPreview = useMemo(() => (creationBBC ? renderBbcode(creationBBC) : ''), [creationBBC]);
  const updatePreview = useMemo(() => (updateBBC ? renderBbcode(updateBBC) : ''), [updateBBC]);

  const handleCopy = async (text: string, type: 'creation' | 'update') => {
    if (!text) {
      toast.error('Nothing to copy yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      if (type === 'creation') {
        setCreationCopied(true);
        setTimeout(() => setCreationCopied(false), 1500);
      } else {
        setUpdateCopied(true);
        setTimeout(() => setUpdateCopied(false), 1500);
      }
      toast.success('BBC copied to clipboard.');
    } catch {
      toast.error('Unable to copy BBC.');
    }
  };

  const handleSaveCreation = async () => {
    if (!creationBBC) {
      toast.error('Generate the BBC before saving.');
      return;
    }

    setSavingCreation(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You are not signed in.');
        return;
      }

      const { error } = await supabase.from('employee_profile_activities').insert({
        user_id: user.id,
        employee_name: employeeName || 'N/A',
        department_rank: departmentRank || 'N/A',
        badge_number: badgeNumber || 'N/A',
        division_assignment: divisionAssignment || 'N/A',
        date_of_employment: dateOfEmployment || 'N/A',
        application_link: applicationLink || '**Attachment**',
        awards: awards || null,
        ribbon_rack: ribbonRack || null,
        disciplinary_record: disciplinaryRecord || null,
        previous_name: previousName || null,
        discord: discord || 'N/A',
        timezone: timezone || 'N/A',
        country_of_residence: countryOfResidence || 'N/A',
        generated_bbc: creationBBC,
      });

      if (error) throw error;
      toast.success('Employee profile saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save employee profile.');
    } finally {
      setSavingCreation(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!updateBBC) {
      toast.error('Generate the BBC before saving.');
      return;
    }

    setSavingUpdate(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You are not signed in.');
        return;
      }

      const { error } = await supabase.from('employee_profile_update_activities').insert({
        user_id: user.id,
        updated_information: updatedInformation || 'N/A',
        approved_by: approvedBy || 'N/A',
        additional_information: additionalInformation || null,
        generated_bbc: updateBBC,
      });

      if (error) throw error;
      toast.success('Update log saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save update log.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const renderCreationTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-5 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Profile Inputs</h2>
        <p className="text-sm text-muted-foreground">
          Provide employee information and we&apos;ll merge it into the BBC template automatically.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Employee Name</label>
            <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department Rank</label>
              <Input
                value={departmentRank}
                onChange={(e) => setDepartmentRank(e.target.value)}
                placeholder="Firefighter II"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Badge Number</label>
              <Input value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="###" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Division / Assignment</label>
            <Input
              value={divisionAssignment}
              onChange={(e) => setDivisionAssignment(e.target.value)}
              placeholder="HazMat / Rescue 1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date of Employment</label>
              <Input
                value={dateOfEmployment}
                onChange={(e) => setDateOfEmployment(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Application Link</label>
              <Input
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.target.value)}
                placeholder="Forum link or attachment"
              />
            </div>
          </div>

          <Textarea
            label="Awards"
            value={awards}
            onChange={(e) => setAwards(e.target.value)}
            placeholder="- [I]Award Name[/I] — [I]Date Issued[/I]"
          />

          <Textarea
            label="Ribbon Rack"
            value={ribbonRack}
            onChange={(e) => setRibbonRack(e.target.value)}
            placeholder='[IMG]https://i.imgur.com/example.png[/IMG]'
          />

          <Textarea
            label="Disciplinary Record"
            value={disciplinaryRecord}
            onChange={(e) => setDisciplinaryRecord(e.target.value)}
            placeholder="- [I]Reprimand / Warning[/I] — [I]Reason[/I] — [I]DD/MM/YYYY[/I]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Previous Name</label>
              <Input value={previousName} onChange={(e) => setPreviousName(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Discord</label>
              <Input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username#0000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="GMT+8" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Country of Residence</label>
              <Input
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                placeholder="Philippines"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Generated BBC</h2>
            <p className="text-sm text-muted-foreground">Copy or save the generated code. Preview updates live.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleCopy(creationBBC, 'creation')} disabled={!creationBBC}>
              {creationCopied ? '✓ Copied!' : 'Copy BBC'}
            </Button>
            <Button onClick={handleSaveCreation} disabled={!creationBBC || savingCreation}>
              {savingCreation ? 'Saving…' : 'Save Activity'}
            </Button>
          </div>
        </div>

        {creationTemplate ? (
          <>
            <Textarea label="BBC Output" value={creationBBC} readOnly className="font-mono" rows={12} />
            <div className="p-4 bg-secondary rounded-md min-h-[200px]">
              {creationPreview ? (
                <BbcodePreview html={creationPreview} title="Employee profile preview" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fill out the fields to generate a live preview of the employee profile.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No employee profile template found. Ask a commander to seed one via Supabase.
          </p>
        )}
      </div>
    </div>
  );

  const renderUpdateTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-5 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Update Log Inputs</h2>
        <p className="text-sm text-muted-foreground">Use this template to record changes to an existing profile.</p>

        <Textarea
          label="Updated Information"
          value={updatedInformation}
          onChange={(e) => setUpdatedInformation(e.target.value)}
          placeholder="List the updated sections or information."
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Approved By</label>
          <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="Commander Name" />
        </div>

        <Textarea
          label="Additional Information"
          value={additionalInformation}
          onChange={(e) => setAdditionalInformation(e.target.value)}
          placeholder="Optional notes or context."
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Update BBC</h2>
            <p className="text-sm text-muted-foreground">Copy or save the update log for quick posting.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleCopy(updateBBC, 'update')} disabled={!updateBBC}>
              {updateCopied ? '✓ Copied!' : 'Copy BBC'}
            </Button>
            <Button onClick={handleSaveUpdate} disabled={!updateBBC || savingUpdate}>
              {savingUpdate ? 'Saving…' : 'Save Update'}
            </Button>
          </div>
        </div>

        {updateTemplate ? (
          <>
            <Textarea label="BBC Output" value={updateBBC} readOnly className="font-mono" rows={10} />
            <div className="p-4 bg-secondary rounded-md min-h-[200px]">
              {updatePreview ? (
                <BbcodePreview html={updatePreview} title="Employee update preview" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Provide the updated details to generate the preview.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No update log template found. Ask a commander to seed one via Supabase.
          </p>
        )}
      </div>
    </div>
  );

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
                  <p className="text-muted-foreground">
                    Generate BBC-formatted employee profiles and update logs in seconds.
                  </p>
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
                      activeTab === 'update'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Update Logs
                  </button>
                </div>
              </div>

              {activeTab === 'creation' ? renderCreationTab() : renderUpdateTab()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
