'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { renderBbcode } from '@/lib/bbcode';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
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

type TemplateRow = {
  id: string;
  status: string;
  template_code: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

const SUPERVISION_LOG_TEMPLATE = `GI/PI's name:
Activity they have performed: (Interview, Orentation, Practical, Reinst. Exam/exam)
Personal Evaluation:
Note/feedback:
Screenshots: (make sure to toggle every chat setting and send atleast 1 screenshot with /time)`;

const TYPE_OPTIONS = [
  { value: 'supervision', label: 'General', activity: '' },
  { value: 'supervision_interview', label: 'Interview', activity: 'Interview' },
  { value: 'supervision_orentation', label: 'Orentation', activity: 'Orentation' },
  { value: 'supervision_practical', label: 'Practical', activity: 'Practical' },
  { value: 'supervision_reinst_exam', label: 'Reinst. Exam/exam', activity: 'Reinst. Exam/exam' },
];

const ACTIVITY_OPTIONS: string[] = ['Interview', 'Orentation', 'Practical', 'Reinst. Exam/exam'];

export default function SupervisionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>(TYPE_OPTIONS[0].value);

  const [giName, setGiName] = useState('');
  const [activityPerformed, setActivityPerformed] = useState<string>(TYPE_OPTIONS[0].activity);
  const [personalEvaluation, setPersonalEvaluation] = useState('');
  const [noteFeedback, setNoteFeedback] = useState('');
  const [screenshotsNote, setScreenshotsNote] = useState('');

  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copiedBBC, setCopiedBBC] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const [{ data: authData }, { data: profileData }, { data: templateData, error: templateErr }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('profiles')
            .select('id, full_name, hr_rank')
            .maybeSingle(),
          supabase
            .from('bbc_templates')
            .select('id, status, template_code')
            .eq('template_group', 'supervision')
            .order('status'),
        ]);

        if (!authData.user) {
          toast.error('You must be signed in to use supervision tools.');
          setLoading(false);
          return;
        }

        if (profileData) {
          setProfile(profileData as UserProfile);
        }

        if (templateErr) {
          toast.error(templateErr.message || 'Failed to load supervision templates');
          setTemplates([]);
        } else {
          const rows = (templateData ?? []) as TemplateRow[];
          setTemplates(rows);

          if (rows.length) {
            const availableOption =
              TYPE_OPTIONS.find((option) => rows.some((row) => row.status === option.value)) ?? null;
            if (availableOption) {
              setSelectedStatus(availableOption.value);
              setActivityPerformed(availableOption.activity);
            } else {
              setSelectedStatus(rows[0].status);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'supervision') return;
    const match = TYPE_OPTIONS.find((option) => option.value === selectedStatus);
    setActivityPerformed(match?.activity ?? '');
  }, [selectedStatus]);

  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.status === selectedStatus) ?? null;
  }, [templates, selectedStatus]);

  const canGenerate = Boolean(
    profile &&
      selectedTemplate &&
      giName.trim() &&
      (selectedStatus === 'supervision' ? activityPerformed.trim() : true) &&
      personalEvaluation.trim() &&
      noteFeedback.trim() &&
      screenshotsNote.trim(),
  );

  const generateTemplate = () => {
    if (!profile || !selectedTemplate) {
      toast.error('Missing template or profile data.');
      return;
    }

    let bbc = selectedTemplate.template_code;
    bbc = bbc.replace(/{{member_name}}/g, giName.trim());
    bbc = bbc.replace(/{{hr_name}}/g, profile.full_name);
    bbc = bbc.replace(/{{hr_rank}}/g, profile.hr_rank);
    bbc = bbc.replace(/{{activity_performed}}/g, activityPerformed);
    bbc = bbc.replace(/{{personal_evaluation}}/g, personalEvaluation.trim());
    bbc = bbc.replace(/{{note_feedback}}/g, noteFeedback.trim());
    bbc = bbc.replace(/{{screenshots}}/g, screenshotsNote.trim());

    setGeneratedBBC(bbc);
    toast.success('BBC template generated');
  };

  const handleCopyBBC = async () => {
    if (!generatedBBC) return;
    try {
      await navigator.clipboard.writeText(generatedBBC);
      setCopiedBBC(true);
      setTimeout(() => setCopiedBBC(false), 2000);
      toast.success('BBC copied to clipboard');
    } catch {
      toast.error('Failed to copy BBC content');
    }
  };

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(SUPERVISION_LOG_TEMPLATE);
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
      toast.success('Log markdown copied');
    } catch {
      toast.error('Failed to copy log markdown');
    }
  };

  const resetForm = () => {
    setGiName('');
    const defaultOption = TYPE_OPTIONS.find((option) => option.value === selectedStatus);
    setActivityPerformed(defaultOption?.activity ?? '');
    setPersonalEvaluation('');
    setNoteFeedback('');
    setScreenshotsNote('');
    setGeneratedBBC('');
    setCopiedBBC(false);
    setCopiedLog(false);
  };

  const handleSaveActivity = async () => {
    if (!generatedBBC) {
      toast.error('Generate the BBC output first.');
      return;
    }

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
        activity_type: 'supervision',
      });

      if (error) {
        toast.error(error.message || 'Failed to save supervision activity');
        return;
      }

      toast.success('Supervision activity saved');
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save supervision activity');
    } finally {
      setSaving(false);
    }
  };

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4 space-y-5">
                <div className="space-y-4">
                  <Select
                    label="Session Type"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    options={templates.map((template) => {
                      const match = TYPE_OPTIONS.find((option) => option.value === template.status);
                      return {
                        value: template.status,
                        label: match?.label ?? template.status,
                      };
                    })}
                  />

                  <Input
                    label="GI/PI's name"
                    placeholder="Enter GI/PI's full name"
                    value={giName}
                    onChange={(e) => setGiName(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Activity performed</label>
                    <select
                      value={activityPerformed}
                      onChange={(e) => setActivityPerformed(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ACTIVITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep in sync with: Interview, Orentation, Practical, Reinst. Exam/exam
                    </p>
                  </div>

                  <Textarea
                    label="Personal Evaluation"
                    placeholder="Write your evaluation of the GI/PI"
                    value={personalEvaluation}
                    onChange={(e) => setPersonalEvaluation(e.target.value)}
                    className="min-h-[140px]"
                  />

                  <Textarea
                    label="Note / Feedback"
                    placeholder="Key notes or feedback you shared"
                    value={noteFeedback}
                    onChange={(e) => setNoteFeedback(e.target.value)}
                    className="min-h-[120px]"
                  />

                  <Textarea
                    label="Screenshots summary"
                    placeholder="Mention uploaded screenshots / links"
                    value={screenshotsNote}
                    onChange={(e) => setScreenshotsNote(e.target.value)}
                    className="min-h-[100px]"
                  />

                  <Button onClick={generateTemplate} disabled={!canGenerate} className="w-full">
                    Generate Template
                  </Button>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Log Markdown</h3>
                  <Button onClick={handleCopyLog} variant="outline" className="w-full">
                    {copiedLog ? '✓ Copied!' : 'Copy Log Markdown'}
                  </Button>
                  <div className="p-3 bg-secondary rounded-md">
                    <div
                      className="text-sm text-foreground whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(SUPERVISION_LOG_TEMPLATE) }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8 flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleCopyBBC} disabled={!generatedBBC} variant="outline" className="flex-1">
                    {copiedBBC ? '✓ Copied!' : 'Copy BBC'}
                  </Button>
                  <Button
                    onClick={handleSaveActivity}
                    disabled={!generatedBBC || saving}
                    variant="primary"
                    className="flex-1"
                  >
                    {saving ? 'Saving…' : 'Save Activity'}
                  </Button>
                </div>

                {generatedBBC ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-md h-[600px]">
                      <BbcodePreview html={renderBbcode(generatedBBC)} title="Supervision BBC preview" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Raw BBC</p>
                      <div className="rounded-md border border-dashed border-border bg-background p-3 font-mono text-[11px] text-foreground whitespace-pre-wrap">
                        {generatedBBC}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                    Generate a template to preview the BBC output.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
