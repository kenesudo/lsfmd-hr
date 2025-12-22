'use client';

import { useMemo } from 'react';

type BbcodePreviewProps = {
  html: string;
  title?: string;
  className?: string;
};

function buildPreviewDocument(innerHtml: string) {
  return `<div style="font-family: Arial, 'Helvetica Neue', sans-serif;">${innerHtml}</div>`;
}

export default function BbcodePreview({ html, title = 'BBCode preview', className = '' }: BbcodePreviewProps) {
  const srcDoc = useMemo(() => buildPreviewDocument(html), [html]);
  const baseClass = 'block h-full w-full rounded-md border border-border';

  return (
    <iframe
      title={title}
      className={`${baseClass}${className ? ` ${className}` : ''}`}
      srcDoc={srcDoc}
      sandbox="allow-popups allow-top-navigation-by-user-activation"
    />
  );
}
