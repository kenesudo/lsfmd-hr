'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { renderBbcode } from '@/lib/bbcode';
import { useMemo, useState } from 'react';

const SAMPLE_BBCODE = `[SIZE=6][COLOR=white]Hello World![/COLOR][/SIZE]`;

export default function BbcodePreviewerPage() {
  const [bbcode, setBbcode] = useState(SAMPLE_BBCODE);
  const [copied, setCopied] = useState(false);

  const previewHtml = useMemo(() => renderBbcode(bbcode), [bbcode]);
  const hasContent = bbcode.trim().length > 0;

  const handleCopy = async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(bbcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy BBCode', error);
    }
  };

  const handleReset = () => {
    setBbcode('');
    setCopied(false);
  };

  const handleSample = () => {
    setBbcode(SAMPLE_BBCODE);
    setCopied(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Utilities</p>
              <h1 className="text-3xl font-semibold text-foreground">BBCode Previewer</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Draft BBCode in the editor and see a sanitized HTML preview instantly. Use this to verify forum
                formatting before posting.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">BBCode Input</h2>
                  <p className="text-sm text-muted-foreground">
                    Type or paste template code. Special tags follow the bbob HTML5 preset.
                  </p>
                </div>

                <Textarea
                  label="BBCode"
                  value={bbcode}
                  onChange={(event) => setBbcode(event.target.value)}
                  rows={18}
                  className="font-mono text-sm"
                  placeholder="[b]Bold[/b] [i]Italic[/i] [url=https://example.com]Link[/url]"
                />

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCopy} disabled={!hasContent}>
                    {copied ? 'Copied!' : 'Copy BBCode'}
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={!hasContent}>
                    Clear
                  </Button>
                  <Button variant="ghost" type="button" onClick={handleSample}>
                    Load Sample
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Live Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Renders with the same parser used elsewhere in the app. External links and media are sanitized.
                  </p>
                </div>

                <div className="p-4 bg-secondary rounded-md min-h-[360px] overflow-auto">
                  {hasContent ? (
                    <BbcodePreview html={previewHtml} className="w-full min-h-[360px]" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
                      Start typing BBCode to see the formatted result.
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
