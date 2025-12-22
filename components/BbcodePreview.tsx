'use client';

import { useMemo } from 'react';

type BbcodePreviewProps = {
  html: string;
  title?: string;
  className?: string;
};

function buildPreviewDocument(innerHtml: string) {
  return `<div style="font-family: Arial, 'Helvetica Neue', sans-serif; line-height: 1.5; font-size: 14px;">${innerHtml}</div>`;
}

export default function BbcodePreview({
  html,
  title = 'BBCode preview',
  className = 'w-full rounded-md border border-border',
}: BbcodePreviewProps) {
  const srcDoc = useMemo(() => buildPreviewDocument(html), [html]);

  return (
    <iframe
      title={title}
      className={className}
      srcDoc={srcDoc}
      sandbox="allow-popups allow-top-navigation-by-user-activation"
    />
  );
}
