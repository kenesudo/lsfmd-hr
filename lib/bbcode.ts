import render from '@bbob/html';
import presetHtml5 from '@bbob/preset-html5';

const preset = presetHtml5();

const allowedProtocols = /^(?:https?:|mailto:|#)/i;

function sanitizeUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (allowedProtocols.test(trimmed)) return trimmed;
  return null;
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function preprocess(bbcode: string) {
  return bbcode
    .replace(/\[url=([^\]]+)\]/gi, (_match, url) => {
      const safe = sanitizeUrl(url);
      return safe ? `[url=${safe}]` : '[url]';
    })
    .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_match, url) => {
      const safe = sanitizeUrl(url);
      return safe ? `[img]${safe}[/img]` : '';
    })
    .replace(/\[img=([^\]]+)\]([\s\S]*?)\[\/img\]/gi, (_match, url, alt) => {
      const safe = sanitizeUrl(url);
      return safe ? `[img=${safe}]${alt}[/img]` : escapeHtml(alt);
    });
}

function sanitizeAttributes(html: string) {
  return html.replace(/(href|src)=["']([^"']*)["']/gi, (_match, attr, value) => {
    const safe = sanitizeUrl(value);
    if (!safe) {
      return attr === 'href' ? `${attr}="#"` : `${attr}=""`;
    }
    return `${attr}="${safe}"`;
  });
}

export function renderBbcode(bbcodeText: string | null | undefined) {
  if (!bbcodeText) return '';

  const trimmed = bbcodeText.trim();
  if (!trimmed) return '';

  const normalized = preprocess(trimmed);

  try {
    let html = render(normalized, preset, { onlyAllowTags: undefined });
    html = sanitizeAttributes(html);
    return html.replace(/\r\n|\r|\n/g, '<br />');
  } catch (error) {
    console.error('Failed to render BBCode', error);
    return escapeHtml(trimmed).replace(/\r\n|\r|\n/g, '<br />');
  }
}
