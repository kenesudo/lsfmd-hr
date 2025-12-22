'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { renderBbcode } from '@/lib/bbcode';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function safeUrl(url: string) {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type TrainingStatus = 'creation' | 'training' | 'exam' | 'close' | 'reopen';

type BBCTemplate = {
  id: string;
  status: TrainingStatus;
  template_code: string;
};

const STATUS_OPTIONS: { value: TrainingStatus; label: string }[] = [
  { value: 'creation', label: 'Creation' },
  { value: 'training', label: 'Training' },
  { value: 'exam', label: 'Exam' },
  { value: 'close', label: 'Close' },
  { value: 'reopen', label: 'Reopen' },
];

type RecruitedVia = 'Application' | 'Reinstatement';

type TrainingCompletion = 'ORIENTATION' | 'PRACTICAL TRAINING' | 'BOTH';

type ExamResult = 'PASSED' | 'FAILED';

export default function TrainingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<BBCTemplate[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<TrainingStatus>('creation');

  const [memberName, setMemberName] = useState('');

  // Creation inputs
  const [recruitedVia, setRecruitedVia] = useState<RecruitedVia>('Application');
  const [discord, setDiscord] = useState('');
  const [forumLink, setForumLink] = useState('');

  // Training inputs
  const [trainingCompletion, setTrainingCompletion] = useState<TrainingCompletion>('ORIENTATION');
  const [instructor, setInstructor] = useState('');

  // Exam inputs
  const [examResult, setExamResult] = useState<ExamResult>('PASSED');
  const [examScore, setExamScore] = useState('');
  const [comments, setComments] = useState('');

  // Close inputs
  const [closeReason, setCloseReason] = useState('');

  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copied, setCopied] = useState(false);
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

      const { data: templateData } = await supabase
        .from('trainings_bbc_templates')
        .select('id, status, template_code')
        .order('created_at', { ascending: true });

      if (templateData) {
        setTemplates(templateData as BBCTemplate[]);
      }
    };

    fetchData();
  }, []);

  const statusTemplate = useMemo(() => {
    return templates.find((t) => t.status === selectedStatus) ?? null;
  }, [templates, selectedStatus]);

  const canGenerate = useMemo(() => {
    if (!profile) return false;
    if (!statusTemplate) return false;
    if (!memberName.trim()) return false;

    if (selectedStatus === 'creation') {
      return Boolean(discord.trim() && forumLink.trim());
    }

    if (selectedStatus === 'training') {
      return Boolean(instructor.trim());
    }

    if (selectedStatus === 'exam') {
      if (!instructor.trim()) return false;
      if (examResult === 'FAILED' && !comments.trim()) return false;
      return true;
    }

    if (selectedStatus === 'close') {
      return Boolean(closeReason.trim());
    }

    // reopen template not provided yet; allow generate only if template exists
    return Boolean(statusTemplate);
  }, [profile, statusTemplate, memberName, selectedStatus, discord, forumLink, instructor, examResult, comments, closeReason]);

  const handleGenerate = async () => {
    if (!profile) return;
    if (!statusTemplate) {
      toast.error('No template found for this status');
      setGeneratedBBC('');
      return;
    }

    let bbc = statusTemplate.template_code;

    bbc = bbc.replace(/{{member_name}}/g, memberName.trim());
    bbc = bbc.replace(/{{recruited_via}}/g, recruitedVia);
    bbc = bbc.replace(/{{discord}}/g, discord.trim());

    const safeForum = safeUrl(forumLink);
    bbc = bbc.replace(/{{forum_link}}/g, safeForum || forumLink.trim());

    bbc = bbc.replace(/{{training_completion}}/g, trainingCompletion);
    bbc = bbc.replace(/{{instructor}}/g, instructor.trim());

    bbc = bbc.replace(/{{exam_passed_label}}/g, 'PASSED:');
    bbc = bbc.replace(/{{exam_failed_label}}/g, 'FAILED:');

    const scoreText = examScore.trim() ? `[${examScore.trim()}]` : '';
    bbc = bbc.replace(/{{exam_score}}/g, scoreText);

    bbc = bbc.replace(/{{comments}}/g, comments.trim() || 'N/A');

    bbc = bbc.replace(/{{close_reason}}/g, closeReason.trim() || 'N/A');

    setGeneratedBBC(bbc);
  };

  const handleCopy = async () => {
    try {
      if (!generatedBBC) return;
      await navigator.clipboard.writeText(generatedBBC);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('BBC code copied');
    } catch {
      toast.error('Failed to copy BBC code');
    }
  };

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

  const resetAll = () => {
    setMemberName('');

    setRecruitedVia('Application');
    setDiscord('');
    setForumLink('');

    setTrainingCompletion('ORIENTATION');
    setInstructor('');

    setExamResult('PASSED');
    setExamScore('');
    setComments('');

    setCloseReason('');

    setGeneratedBBC('');
    setCopied(false);
    setLogCopied(false);
    setTfLogCopied(false);
  };

  const handleGetScore = async () => {
    if (!generatedBBC) return;

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You are not signed in');
        return;
      }

      const details: Record<string, unknown> = {
        recruited_via: recruitedVia,
        discord,
        forum_link: forumLink,
        training_completion: trainingCompletion,
        instructor,
        exam_result: examResult,
        exam_score: examScore,
        comments,
        close_reason: closeReason,
      };

      const { error } = await supabase.from('trainings_activities').insert({
        user_id: user.id,
        status: selectedStatus,
        member_name: memberName,
        details,
        generated_bbc: generatedBBC,
      });

      if (error) {
        toast.error(error.message || 'Failed to save activity');
        return;
      }

      toast.success('Saved successfully');
      resetAll();
    } catch {
      toast.error('Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-8">Trainings</h1>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Inputs</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => {
                          const next = e.target.value as TrainingStatus;
                          setSelectedStatus(next);
                          setGeneratedBBC('');
                          setCopied(false);
                        }}
                        options={STATUS_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Member Name</label>
                      <Input
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Enter member name"
                      />
                    </div>

                    {selectedStatus === 'creation' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Recruited Via</label>
                          <Select
                            value={recruitedVia}
                            onChange={(e) => setRecruitedVia(e.target.value as RecruitedVia)}
                            options={[
                              { value: 'Application', label: 'Application' },
                              { value: 'Reinstatement', label: 'Reinstatement' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Discord</label>
                          <Input
                            value={discord}
                            onChange={(e) => setDiscord(e.target.value)}
                            placeholder="eg. _kenesu"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Forum Account Link</label>
                          <Input
                            value={forumLink}
                            onChange={(e) => setForumLink(e.target.value)}
                            placeholder="https://forums..."
                          />
                        </div>
                      </>
                    )}

                    {selectedStatus === 'training' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Training Completion</label>
                          <Select
                            value={trainingCompletion}
                            onChange={(e) => setTrainingCompletion(e.target.value as TrainingCompletion)}
                            options={[
                              { value: 'ORIENTATION', label: 'ORIENTATION' },
                              { value: 'PRACTICAL TRAINING', label: 'PRACTICAL TRAINING' },
                              { value: 'BOTH', label: 'BOTH' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Instructor / Supervisor</label>
                          <Input
                            value={instructor}
                            onChange={(e) => setInstructor(e.target.value)}
                            placeholder="Enter instructor name"
                          />
                        </div>
                      </>
                    )}

                    {selectedStatus === 'exam' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Exam Result</label>
                          <Select
                            value={examResult}
                            onChange={(e) => setExamResult(e.target.value as ExamResult)}
                            options={[
                              { value: 'PASSED', label: 'PASSED' },
                              { value: 'FAILED', label: 'FAILED' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Score</label>
                          <Input
                            value={examScore}
                            onChange={(e) => setExamScore(e.target.value)}
                            placeholder="e.g. 9/10"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Instructor / Supervisor</label>
                          <Input
                            value={instructor}
                            onChange={(e) => setInstructor(e.target.value)}
                            placeholder="Enter instructor name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Comments (mandatory if failed)</label>
                          <Input
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder={examResult === 'FAILED' ? 'Required' : 'Optional'}
                          />
                        </div>
                      </>
                    )}

                    {selectedStatus === 'close' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Close Reason</label>
                        <Input
                          value={closeReason}
                          onChange={(e) => setCloseReason(e.target.value)}
                          placeholder="Enter reason"
                        />
                      </div>
                    )}

                    {selectedStatus === 'reopen' && (
                      <p className="text-sm text-muted-foreground">
                        Reopen template not added yet.
                      </p>
                    )}

                    <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
                      Generate Template
                    </Button>

                    <div className="pt-4 border-t border-border">
                      <h3 className="text-lg font-semibold text-foreground mb-3">Logging Section</h3>

                      {generatedBBC ? (
                        <div className="space-y-4">
                          {(selectedStatus === 'training' || selectedStatus === 'exam') && (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button onClick={handleCopyTrainingLog} className="w-full">
                                  {logCopied ? '✓ Copied!' : 'Copy Log'}
                                </Button>
                              </div>
                              <div className="p-3 bg-secondary rounded-md">
                                <div className="text-sm text-foreground overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{trainingLogMarkdown}</pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {(selectedStatus === 'creation' || selectedStatus === 'close') && (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button onClick={handleCopyTfLog} className="w-full" variant="outline">
                                  {tfLogCopied ? '✓ Copied!' : 'Copy TF Log'}
                                </Button>
                              </div>
                              <div className="p-3 bg-secondary rounded-md">
                                <div className="text-sm text-foreground overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{tfLogMarkdown}</pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Generate a template to show the log markdown.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Generated BBC Code</h2>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopy}
                        disabled={!generatedBBC}
                        variant="outline"
                        className="flex-1"
                      >
                        {copied ? '✓ Copied!' : 'Copy to Clipboard'}
                      </Button>
                      <Button
                        onClick={handleGetScore}
                        disabled={!generatedBBC || saving}
                        variant="primary"
                        className="flex-1"
                      >
                        {saving ? 'Saving…' : 'Get Score'}
                      </Button>
                    </div>

                    {generatedBBC && (
                      <div className="mt-4 p-4 bg-secondary rounded-md h-screen">
                        <BbcodePreview
                          html={renderBbcode(generatedBBC)}
                          title="Training BBC preview"
                        />
                      </div>
                    )}
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
