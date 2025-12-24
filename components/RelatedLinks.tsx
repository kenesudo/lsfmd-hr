'use client';

type RelatedLink = {
  label: string;
  href: string;
};

type RelatedLinksProps = {
  links: RelatedLink[];
  note?: string;
  className?: string;
};

export default function RelatedLinks({ links, note, className = '' }: RelatedLinksProps) {
  if (!links.length) return null;

  return (
    <div className={`rounded-md flex gap-2 items-center flex-wrap border border-border bg-card px-3 py-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Related Links</span>
        {note ? <span className="text-[11px] text-muted-foreground">{note}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-secondary"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
