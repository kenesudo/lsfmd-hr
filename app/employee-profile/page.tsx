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

const AWARD_PLACEHOLDER = '- [I]Award Name[/I] — [I]Date Issued[/I]';
const DEFAULT_AWARDS = Array(2).fill(AWARD_PLACEHOLDER).join('\n');
const RIBBON_PLACEHOLDER = '[IMG]https://i.imgur.com/noawards.png[/IMG]';
const DEFAULT_RIBBONS = Array(3).fill(RIBBON_PLACEHOLDER).join('\n');
const DISCIPLINARY_PLACEHOLDER = '- [I]Reprimand / Warning[/I] — [I]Reason[/I] — [I]DD/MM/YYYY[/I]';
const DEFAULT_DISCIPLINARY = Array(2).fill(DISCIPLINARY_PLACEHOLDER).join('\n');

const splitEntries = (value: string) => {
  if (!value.trim()) return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const stripItalics = (value: string = '') => value.replace(/\[\/?I\]/gi, '').replace(/^-\s*/, '').trim();
const extractImgUrl = (entry: string) => {
  const match = entry.match(/\[IMG\](.*?)\[\/IMG\]/i);
  return match ? match[1] : entry;
};

const removeEntryAtIndex = (value: string, index: number) => {
  const entries = splitEntries(value);
  if (index < 0 || index >= entries.length) return entries.join('\n');
  entries.splice(index, 1);
  return entries.join('\n');
};

const parseAwardEntry = (entry: string) => {
  const parts = entry.replace(/^-\s*/, '').split('—').map((part) => stripItalics(part));
  return {
    name: parts[0]?.trim() || 'Award Name',
    date: parts[1]?.trim() || 'Date Issued',
  };
};

const parseDisciplinaryEntry = (entry: string) => {
  const parts = entry.replace(/^-\s*/, '').split('—').map((part) => stripItalics(part));
  return {
    type: parts[0]?.trim() || 'Reprimand / Warning',
    reason: parts[1]?.trim() || 'Reason',
    date: parts[2]?.trim() || 'DD/MM/YYYY',
  };
};

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
  const [awardNameInput, setAwardNameInput] = useState('');
  const [awardDateInput, setAwardDateInput] = useState('');
  const [ribbonUrlInput, setRibbonUrlInput] = useState('');
  const [disciplinaryTypeInput, setDisciplinaryTypeInput] = useState('');
  const [disciplinaryReasonInput, setDisciplinaryReasonInput] = useState('');
  const [disciplinaryDateInput, setDisciplinaryDateInput] = useState('');
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

  const appendEntry = (current: string, entry: string) => {
    const hasContent = current.trim().length > 0;
    return hasContent ? `${current.trim()}\n${entry}` : entry;
  };

  const handleAddAward = () => {
    if (!awardNameInput.trim() || !awardDateInput.trim()) {
      toast.error('Provide both award name and date.');
      return;
    }

    const entry = `- [I]${awardNameInput.trim()}[/I] — [I]${awardDateInput.trim()}[/I]`;
    setAwards((prev) => appendEntry(prev, entry));
    setAwardNameInput('');
    setAwardDateInput('');
  };

  const handleAddRibbon = () => {
    if (!ribbonUrlInput.trim()) {
      toast.error('Provide a ribbon image URL.');
      return;
    }

    const entry = `[IMG]${ribbonUrlInput.trim()}[/IMG]`;
    setRibbonRack((prev) => appendEntry(prev, entry));
    setRibbonUrlInput('');
  };

  const handleAddDisciplinaryRecord = () => {
    if (!disciplinaryTypeInput.trim() || !disciplinaryReasonInput.trim() || !disciplinaryDateInput.trim()) {
      toast.error('Provide reprimand type, reason, and date.');
      return;
    }

    const entry = `- [I]${disciplinaryTypeInput.trim()}[/I] — [I]${disciplinaryReasonInput.trim()}[/I] — [I]${disciplinaryDateInput.trim()}[/I]`;
    setDisciplinaryRecord((prev) => appendEntry(prev, entry));
    setDisciplinaryTypeInput('');
    setDisciplinaryReasonInput('');
    setDisciplinaryDateInput('');
  };

  const handleRemoveAward = (index: number) => {
    setAwards((prev) => removeEntryAtIndex(prev, index));
  };

  const handleRemoveRibbon = (index: number) => {
    setRibbonRack((prev) => removeEntryAtIndex(prev, index));
  };

  const handleRemoveDisciplinaryRecord = (index: number) => {
    setDisciplinaryRecord((prev) => removeEntryAtIndex(prev, index));
  };

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
          .from('bbc_templates')
          .select('id, status, template_code')
          .eq('template_group', 'employee_profile_creation')
          .order('status', { ascending: true });

        if (creationError) throw creationError;
        setCreationTemplate(creationData?.[0] ?? null);

        const { data: updateData, error: updateError } = await supabase
          .from('bbc_templates')
          .select('id, status, template_code')
          .eq('template_group', 'employee_profile_update')
          .order('status', { ascending: true });

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

    const awardsContent = awards.trim() ? awards.trim() : DEFAULT_AWARDS;
    const ribbonsContent = ribbonRack.trim() ? ribbonRack.trim() : DEFAULT_RIBBONS;
    const disciplinaryContent = disciplinaryRecord.trim() ? disciplinaryRecord.trim() : DEFAULT_DISCIPLINARY;

    return fillTemplate(creationTemplate.template_code, {
      employee_name: employeeName || 'ANSWER HERE',
      department_rank: departmentRank || 'ANSWER HERE',
      badge_number: badgeNumber || 'N/A',
      division_assignment: divisionAssignment || 'N/A',
      date_of_employment: dateOfEmployment || 'N/A',
      application_link: applicationLink || '**Attachment**',
      awards: awardsContent,
      ribbon_rack: ribbonsContent,
      disciplinary_record: disciplinaryContent,
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

  const awardEntries = useMemo(() => splitEntries(awards), [awards]);
  const ribbonEntries = useMemo(() => splitEntries(ribbonRack), [ribbonRack]);
  const disciplinaryEntries = useMemo(() => splitEntries(disciplinaryRecord), [disciplinaryRecord]);

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

      const { error } = await supabase.from('hr_activities').insert({
        hr_id: user.id,
        bbc_content: creationBBC,
        activity_type: 'personnel_profile_processed',
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

      const { error } = await supabase.from('hr_activities').insert({
        hr_id: user.id,
        bbc_content: updateBBC,
        activity_type: 'personnel_profile_processed',
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

        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Identity & Assignment</h3>
              <p className="text-sm text-muted-foreground">Core information that anchors the employee&apos;s profile.</p>
            </div>
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
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Employment Details</h3>
              <p className="text-sm text-muted-foreground">Key dates and attachments that support the profile.</p>
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
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Awards & Decorations</h3>
              <p className="text-sm text-muted-foreground">Document official commendations with consistent formatting.</p>
            </div>
            <div className="space-y-3">
              {awardEntries.length > 0 ? (
                <ul className="space-y-2">
                  {awardEntries.map((entry, index) => {
                    const { name, date } = parseAwardEntry(entry);
                    return (
                      <li
                        key={`${entry}-${index}`}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg"
                          aria-label={`Remove award ${name}`}
                          onClick={() => handleRemoveAward(index)}
                        >
                          <span aria-hidden>×</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No awards added yet. We&apos;ll auto-fill placeholders on the generated BBC.
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Award Name</label>
                <Input
                  value={awardNameInput}
                  onChange={(e) => setAwardNameInput(e.target.value)}
                  placeholder="Medal of Valor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Issued</label>
                <Input value={awardDateInput} onChange={(e) => setAwardDateInput(e.target.value)} placeholder="DD/MM/YYYY" />
              </div>
              <Button
                type="button"
                onClick={handleAddAward}
                className="w-full md:w-12 h-11 md:mt-6 p-0 text-xl"
                aria-label="Add award entry"
              >
                <span aria-hidden>+</span>
              </Button>
            </div>
            <details className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Advanced: Edit raw awards list</summary>
              <Textarea
                className="mt-3"
                label=""
                value={awards}
                onChange={(e) => setAwards(e.target.value)}
                placeholder={AWARD_PLACEHOLDER}
              />
            </details>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ribbon Rack</h3>
              <p className="text-sm text-muted-foreground">Reference hosted ribbon rack images or add new links quickly.</p>
            </div>
            <div className="space-y-3">
              {ribbonEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ribbonEntries.map((entry, index) => {
                    const url = extractImgUrl(entry);
                    return (
                      <div
                        key={`${entry}-${index}`}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-20 rounded bg-background/80 border border-border overflow-hidden flex items-center justify-center">
                            <img
                              src={url}
                              alt="Ribbon"
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-xs break-all text-muted-foreground max-w-[8rem]">{url}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg"
                          aria-label="Remove ribbon image"
                          onClick={() => handleRemoveRibbon(index)}
                        >
                          <span aria-hidden>×</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No ribbon images yet. Drop URLs to populate the rack automatically.
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ribbon Image URL</label>
                <Input
                  value={ribbonUrlInput}
                  onChange={(e) => setRibbonUrlInput(e.target.value)}
                  placeholder="https://i.imgur.com/..."
                />
              </div>
              <Button
                type="button"
                onClick={handleAddRibbon}
                className="w-full md:w-12 h-11 md:mt-6 p-0 text-xl"
                aria-label="Add ribbon image"
              >
                <span aria-hidden>+</span>
              </Button>
            </div>
            <details className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Advanced: Edit raw ribbon list</summary>
              <Textarea
                className="mt-3"
                label=""
                value={ribbonRack}
                onChange={(e) => setRibbonRack(e.target.value)}
                placeholder='[IMG]https://i.imgur.com/example.png[/IMG]'
              />
            </details>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Disciplinary Records</h3>
              <p className="text-sm text-muted-foreground">Track any reprimands with reason and date for quick reference.</p>
            </div>
            <div className="space-y-3">
              {disciplinaryEntries.length > 0 ? (
                <ul className="space-y-2">
                  {disciplinaryEntries.map((entry, index) => {
                    const info = parseDisciplinaryEntry(entry);
                    return (
                      <li
                        key={`${entry}-${index}`}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{info.type}</p>
                          <p className="text-xs text-muted-foreground">{info.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{info.date}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg"
                          aria-label={`Remove disciplinary record ${info.type}`}
                          onClick={() => handleRemoveDisciplinaryRecord(index)}
                        >
                          <span aria-hidden>×</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No disciplinary records on file. We&apos;ll keep the section empty unless you add entries.
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reprimand / Warning</label>
                <Input
                  value={disciplinaryTypeInput}
                  onChange={(e) => setDisciplinaryTypeInput(e.target.value)}
                  placeholder="Written Warning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reason</label>
                <Input
                  value={disciplinaryReasonInput}
                  onChange={(e) => setDisciplinaryReasonInput(e.target.value)}
                  placeholder="Details"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date (DD/MM/YYYY)</label>
                <Input
                  value={disciplinaryDateInput}
                  onChange={(e) => setDisciplinaryDateInput(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddDisciplinaryRecord}
                className="w-full md:w-12 h-11 md:mt-6 p-0 text-xl"
                aria-label="Add disciplinary record"
              >
                <span aria-hidden>+</span>
              </Button>
            </div>
            <details className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Advanced: Edit raw disciplinary list</summary>
              <Textarea
                className="mt-3"
                label=""
                value={disciplinaryRecord}
                onChange={(e) => setDisciplinaryRecord(e.target.value)}
                placeholder={DISCIPLINARY_PLACEHOLDER}
              />
            </details>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
              <p className="text-sm text-muted-foreground">Contextual info such as aliases and contact preferences.</p>
            </div>
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
          </section>
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
            <div className="p-4 bg-secondary rounded-md h-[100%]">
              {creationPreview ? (
                <BbcodePreview
                  html={creationPreview}
                  title="Employee profile preview"
                />
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
            <div className="p-4 bg-secondary rounded-md h-screen">
              {updatePreview ? (
                <BbcodePreview
                  html={updatePreview}
                  title="Employee update preview"
                />
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
