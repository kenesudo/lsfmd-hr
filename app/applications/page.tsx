'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { renderBbcode } from '@/lib/bbcode';
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

interface BBCTemplate {
  id: string;
  status: string;
  template_code: string;
}

type ApplicationStatus = 
  | 'pending_interview' 
  | 'pending_badge' 
  | 'hired' 
  | 'on_hold' 
  | 'closed' 
  | 'denied' 
  | 'blacklisted';

export default function ApplicationsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<BBCTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('pending_interview');
  const [applicantName, setApplicantName] = useState('');
  const [reasons, setReasons] = useState<string[]>(['']);
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingScore, setGettingScore] = useState(false);

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

      // Fetch BBC templates
      const { data: templatesData } = await supabase
        .from('bbc_templates')
        .select('id, status, template_code')
        .eq('template_group', 'application')
        .order('status');
      
      if (templatesData) {
        setTemplates(templatesData);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    generateBBC();
  }, [selectedStatus, applicantName, reasons, profile, templates]);

  const generateBBC = () => {
    if (!profile || !applicantName.trim()) {
      return '';
    }

    const template = templates.find(t => t.status === selectedStatus);
    if (!template) {
      return '';
    }

    let bbc = template.template_code;
    bbc = bbc.replace(/{{applicant_name}}/g, applicantName);
    bbc = bbc.replace(/{{hr_rank}}/g, profile.hr_rank);
    bbc = bbc.replace(/{{hr_name}}/g, profile.full_name);

    if (selectedStatus === 'on_hold' || selectedStatus === 'closed' || selectedStatus === 'denied' || selectedStatus === 'blacklisted') {
      const cleanReasons = reasons
        .map((r) => r.trim())
        .filter(Boolean);

      const reasonsList = cleanReasons.length
        ? `[LIST]\n${cleanReasons.map((r) => `[*] ${r}`).join('\n')}\n[/LIST]`
        : 'N/A';

      bbc = bbc.replace(/{{reasons}}/g, reasonsList);
    }

    return bbc;
  };

  const handleGenerate = async () => {
    const bbc = generateBBC();
    if (!bbc) {
      setGeneratedBBC('');
      return;
    }

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

  const statusOptions = [
    { value: 'pending_interview', label: 'Pending Interview' },
    { value: 'pending_badge', label: 'Pending Badge' },
    { value: 'hired', label: 'Hired' },
    { value: 'on_hold', label: 'On-Hold' },
    { value: 'closed', label: 'Closed' },
    { value: 'denied', label: 'Denied' },
    { value: 'blacklisted', label: 'Blacklisted' },
  ];

  const showInterviewLog = selectedStatus === 'pending_interview';

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

  const handleSaveActivity = async () => {
    if (!generatedBBC || !profile) return;

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const reasonsText = reasons.filter(r => r.trim()).join('; ');
      
      await supabase.from('hr_activities').insert({
        hr_id: user.id,
        bbc_content: generatedBBC,
        activity_type: 'application_response',
      });

      // Reset form
      setApplicantName('');
      setReasons(['']);
      setGeneratedBBC('');
    }

    setSaving(false);
  };

  const handleGetScore = async () => {
    if (!generatedBBC || !profile) return;

    setGettingScore(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You are not signed in');
        return;
      }

      const reasonsText = reasons.filter(r => r.trim()).join('; ');

      const { error } = await supabase.from('hr_activities').insert({
        hr_id: user.id,
        bbc_content: generatedBBC,
        activity_type: 'application_response',
      });

      if (error) {
        toast.error(error.message || 'Failed to save activity');
        return;
      }

      toast.success('Saved successfully');

      setApplicantName('');
      setReasons(['']);
      setGeneratedBBC('');
      setCopied(false);
      setLogCopied(false);
      setInterviewLogCopied(false);
    } catch {
      toast.error('Failed to save activity');
    } finally {
      setGettingScore(false);
    }
  };

  const addReason = () => {
    setReasons([...reasons, '']);
  };

  const updateReason = (index: number, value: string) => {
    const newReasons = [...reasons];
    newReasons[index] = value;
    setReasons(newReasons);
  };

  const removeReason = (index: number) => {
    if (reasons.length > 1) {
      setReasons(reasons.filter((_, i) => i !== index));
    }
  };

  const requiresReasons = ['on_hold', 'closed', 'denied', 'blacklisted'].includes(selectedStatus);

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Input Section */}
              <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Input Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Application Status
                    </label>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
                      options={statusOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Applicant Name
                    </label>
                    <Input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Enter applicant's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      HR Rank (Auto-filled)
                    </label>
                    <Input
                      type="text"
                      value={profile?.hr_rank || 'Loading...'}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      HR Name (Auto-filled)
                    </label>
                    <Input
                      type="text"
                      value={profile?.full_name || 'Loading...'}
                      disabled
                    />
                  </div>

                  {requiresReasons && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Reason(s)
                      </label>
                      <div className="space-y-2">
                        {reasons.map((reason, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="text"
                              value={reason}
                              onChange={(e) => updateReason(index, e.target.value)}
                              placeholder={`Reason ${index + 1}`}
                            />
                            {reasons.length > 1 && (
                              <button
                                onClick={() => removeReason(index)}
                                className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <Button
                          onClick={addReason}
                          variant="outline"
                          className="w-full"
                        >
                          + Add Another Reason
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={!profile || templates.length === 0}
                    className="w-full"
                  >
                    Generate Template
                  </Button>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Logging Section
                    </h3>

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
                      <p className="text-sm text-muted-foreground">
                        Generate a template to show the log markdown.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BBC Output Section */}
              <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Generated BBC Code
                </h2>

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
                      disabled={!generatedBBC || gettingScore}
                      variant="primary"
                      className="flex-1"
                    >
                      {gettingScore ? 'Saving…' : 'Save Activity'}
                    </Button>
                  </div>

                  {generatedBBC && (
                    <div className="mt-4 p-4 bg-secondary rounded-md h-screen">
                      <BbcodePreview
                        html={renderBbcode(generatedBBC)}
                        title="Application BBC preview"
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
  );
}
