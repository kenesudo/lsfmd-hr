'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
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

function safeUrl(url: string) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
}

function bbcodeToHtml(bbcode: string) {
  let s = escapeHtml(bbcode.trimStart());

  s = s.replaceAll(/\[b\]/gi, '<strong>');
  s = s.replaceAll(/\[\/b\]/gi, '</strong>');
  s = s.replaceAll(/\[i\]/gi, '<em>');
  s = s.replaceAll(/\[\/i\]/gi, '</em>');
  s = s.replaceAll(/\[u\]/gi, '<u>');
  s = s.replaceAll(/\[\/u\]/gi, '</u>');

  s = s.replaceAll(/\[center\]/gi, '<div style="text-align:center">');
  s = s.replaceAll(/\[\/center\]/gi, '</div>');
  s = s.replaceAll(/\[left\]/gi, '<div style="text-align:left">');
  s = s.replaceAll(/\[\/left\]/gi, '</div>');
  s = s.replaceAll(/\[right\]/gi, '<div style="text-align:right">');
  s = s.replaceAll(/\[indent\]/gi, '<div style="margin-left:1rem">');
  s = s.replaceAll(/\[\/indent\]/gi, '</div>');

  s = s.replaceAll(/\[color=([^\]]+)\]/gi, (_m, c) => `<span style="color:${String(c).trim()}">`);
  s = s.replaceAll(/\[color="([^\"]+)"\]/gi, (_m, c) => `<span style="color:${String(c).trim()}">`);
  s = s.replaceAll(/\[\/color\]/gi, '</span>');
  s = s.replaceAll(/\[size=([^\]]+)\]/gi, (_m, sz) => {
    const raw = String(sz).trim();
    const n = Number(raw);
    const px = Number.isFinite(n) ? Math.max(10, Math.min(32, n * 4 + 8)) : 14;
    return `<span style="font-size:${px}px">`;
  });
  s = s.replaceAll(/\[\/size\]/gi, '</span>');

  s = s.replaceAll(/\[quote\]/gi, '<blockquote style="border-left:3px solid rgba(220,20,60,0.5); padding-left:12px; margin:12px 0; opacity:0.95">');
  s = s.replaceAll(/\[\/quote\]/gi, '</blockquote>');

  s = s.replaceAll(/\[url=([^\]]+)\]/gi, (_m, url) => {
    const safe = safeUrl(String(url));
    if (!safe) return '<span>';
    return `<a href="${safe}" target="_blank" rel="noreferrer" style="color:inherit; text-decoration:underline">`;
  });
  s = s.replaceAll(/\[url="([^\"]+)"\]/gi, (_m, url) => {
    const safe = safeUrl(String(url));
    if (!safe) return '<span>';
    return `<a href="${safe}" target="_blank" rel="noreferrer" style="color:inherit; text-decoration:underline">`;
  });
  s = s.replaceAll(/\[\/url\]/gi, '</a>');

  s = s.replaceAll(/\[img\]([\s\S]*?)\[\/img\]/gi, (_m, url) => {
    const safe = safeUrl(String(url));
    if (!safe) return '';
    return `<img src="${safe}" alt="" style="max-width:100%; height:auto; display:block; margin:0 auto;" />`;
  });

  s = s.replaceAll(/\[table[^\]]*\]/gi, '<table style="width:100%; border-collapse:collapse">');
  s = s.replaceAll(/\[\/table\]/gi, '</table>');
  s = s.replaceAll(/\[tr[^\]]*\]/gi, '<tr>');
  s = s.replaceAll(/\[\/tr\]/gi, '</tr>');
  s = s.replaceAll(/\[td[^\]]*\]/gi, '<td style="vertical-align:top">');
  s = s.replaceAll(/\[\/td\]/gi, '</td>');

  s = s.replaceAll(/\[list\]/gi, '<ul style="padding-left:1.25rem; list-style:disc">');
  s = s.replaceAll(/\[\/list\]/gi, '</ul>');
  s = s.replaceAll(/\[\*\]\s*/g, '<li>');
  s = s.replaceAll(/(<li>[\s\S]*?)(?=<li>|<\/ul>)/g, '$1</li>');

  s = s.replaceAll(/\r\n|\r|\n/g, '<br />');
  s = s.replace(/^(?:\s*<br \/>\s*)+/i, '');
  s = s.replaceAll(/<br \/>\s*(?=<(?:table|tr|td|\/table|\/tr|\/td)\b)/gi, '');
  s = s.replaceAll(/(<\/(?:td|tr|table)>)(?:\s*<br \/>\s*)+/gi, '$1');

  return s;
}

type UserProfile = {
  id: string;
  full_name: string;
  hr_rank: string;
};

type ReinstatementStatus =
  | 'on_hold'
  | 'pending_recommendations'
  | 'pending_exam'
  | 'pending_badge'
  | 'exam_failed'
  | 'denied';

type BBCTemplate = {
  id: string;
  status: ReinstatementStatus;
  template_code: string;
};

const STATUS_OPTIONS: { value: ReinstatementStatus; label: string }[] = [
  { value: 'on_hold', label: 'On Hold' },
  { value: 'pending_recommendations', label: 'Pending Recommendations' },
  { value: 'pending_exam', label: 'Pending Reinstatement Exam' },
  { value: 'pending_badge', label: 'Pending Badge' },
  { value: 'exam_failed', label: 'Failed Reinstatement Exam' },
  { value: 'denied', label: 'Denied' },
];

const STATUSES_REQUIRING_REASONS: ReinstatementStatus[] = ['on_hold', 'exam_failed', 'denied'];

export default function ReinstatementPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<BBCTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReinstatementStatus>('on_hold');
  const [applicantName, setApplicantName] = useState('');
  const [reasons, setReasons] = useState<string[]>(['']);
  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copied, setCopied] = useState(false);
  const [gettingScore, setGettingScore] = useState(false);
  const [logCopied, setLogCopied] = useState(false);

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
        .from('reinstatement_bbc_templates')
        .select('id, status, template_code')
        .order('created_at', { ascending: true });

      if (templateData) {
        setTemplates(templateData as BBCTemplate[]);
      }
    };

    fetchData();
  }, []);

  const addReason = () => {
    setReasons([...reasons, '']);
  };

  const updateReason = (index: number, value: string) => {
    const newReasons = [...reasons];
    newReasons[index] = value;
    setReasons(newReasons);
  };

  const removeReason = (index: number) => {
    const newReasons = reasons.filter((_, i) => i !== index);
    setReasons(newReasons.length ? newReasons : ['']);
  };

  const handleGenerate = () => {
    if (!profile) return;

    const template = templates.find((t) => t.status === selectedStatus);
    if (!template) {
      setGeneratedBBC('');
      return;
    }

    let bbc = template.template_code;

    bbc = bbc.replace(/{{hr_rank}}/g, profile.hr_rank);
    bbc = bbc.replace(/{{hr_name}}/g, profile.full_name);

    if (bbc.includes('{{reasons}}')) {
      const cleanReasons = reasons.map((r) => r.trim()).filter(Boolean);
      const reasonsList = cleanReasons.length
        ? `[LIST]\n${cleanReasons.map((r) => `[*] ${r}`).join('\n')}\n[/LIST]`
        : 'N/A';

      bbc = bbc.replace(/{{reasons}}/g, reasonsList);
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

  const logMarkdown = `**Reinstatement: Response / Review**\n**Application Link:**\n**Status:**`;

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

      const { error } = await supabase.from('reinstatement_activities').insert({
        user_id: user.id,
        status: selectedStatus,
        applicant_name: applicantName,
        hr_rank: profile.hr_rank,
        hr_name: profile.full_name,
        reasons: reasonsText || null,
        generated_bbc: generatedBBC,
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
    } catch {
      toast.error('Failed to save activity');
    } finally {
      setGettingScore(false);
    }
  };

  const showReasons = STATUSES_REQUIRING_REASONS.includes(selectedStatus);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-8">Reinstatement Templates</h1>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Inputs</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => {
                          const next = e.target.value as ReinstatementStatus;
                          setSelectedStatus(next);
                          setGeneratedBBC('');
                          if (!STATUSES_REQUIRING_REASONS.includes(next)) {
                            setReasons(['']);
                          }
                        }}
                        options={STATUS_OPTIONS}
                      >
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Applicant Name</label>
                      <Input
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Enter applicant name"
                      />
                    </div>

                    {showReasons && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Reasons</label>
                        <div className="space-y-2">
                          {reasons.map((reason, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={reason}
                                onChange={(e) => updateReason(index, e.target.value)}
                                placeholder={`Reason ${index + 1}`}
                              />
                              {reasons.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => removeReason(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}

                          <Button type="button" variant="outline" onClick={addReason}>
                            Add Reason
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleGenerate} disabled={!profile || templates.length === 0}>
                      Generate Template
                    </Button>

                    <div className="pt-4 border-t border-border">
                      <h3 className="text-lg font-semibold text-foreground mb-3">Logging Section</h3>

                      {generatedBBC ? (
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
                        disabled={!generatedBBC || gettingScore}
                        variant="primary"
                        className="flex-1"
                      >
                        {gettingScore ? 'Saving…' : 'Get Score'}
                      </Button>
                    </div>

                    {generatedBBC && (
                      <div className="mt-4 p-4 bg-secondary rounded-md">
                        <div
                          className="text-sm text-foreground overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: bbcodeToHtml(generatedBBC) }}
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
