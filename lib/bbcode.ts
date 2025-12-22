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

type BbcodeNode = TextNode | TagNode;

interface TextNode {
  type: 'text';
  content: string;
}

interface TagNode {
  type: 'tag';
  name: string;
  value?: string;
  children: BbcodeNode[];
}

const SELF_CLOSING_TAGS = new Set(['br', 'hr']);

interface RenderContext {
  parentTag?: string;
  tableClassSlug?: string | null;
}

export function renderBbcode(bbcodeText: string | null | undefined) {
  if (!bbcodeText) return '';

  const trimmed = bbcodeText.trim();
  if (!trimmed) return '';

  const normalized = preprocess(trimmed);

  try {
    const nodes = parseBbcode(normalized);
    const html = nodes.map((child) => renderNode(child)).join('');
    return sanitizeAttributes(html);
  } catch (error) {
    console.error('Failed to render BBCode', error);
    return escapeHtml(trimmed).replace(/\r\n|\r|\n/g, '<br />');
  }
}

function parseBbcode(input: string) {
  const root: TagNode = { type: 'tag', name: 'root', children: [] };
  const stack: TagNode[] = [root];
  let buffer = '';

  const flushText = () => {
    if (!buffer) return;
    const target = stack[stack.length - 1];
    target.children.push({ type: 'text', content: buffer });
    buffer = '';
  };

  const findListIndex = () => {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].name === 'list') return i;
    }
    return -1;
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char !== '[') {
      buffer += char;
      continue;
    }

    const closeIndex = input.indexOf(']', i + 1);
    if (closeIndex === -1) {
      buffer += char;
      continue;
    }

    const rawTag = input.slice(i + 1, closeIndex);
    if (!rawTag.trim()) {
      buffer += '[';
      continue;
    }

    const isClosing = rawTag.trim().startsWith('/');
    const descriptor = parseTagDescriptor(rawTag);

    if (!descriptor) {
      buffer += `[${rawTag}]`;
      i = closeIndex;
      continue;
    }

    flushText();

    if (isClosing) {
      const name = descriptor.name;
      if (name === 'list') {
        while (stack.length > 1 && stack[stack.length - 1].name === 'li') {
          stack.pop();
        }
      }

      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s].name === name) {
          stack.length = Math.max(1, s);
          break;
        }
      }

      i = closeIndex;
      continue;
    }

    if (descriptor.name === '*') {
      const listIndex = findListIndex();
      if (listIndex === -1) {
        buffer += '[*]';
      } else {
        stack.length = listIndex + 1;
        const parent = stack[stack.length - 1];
        const liNode: TagNode = { type: 'tag', name: 'li', children: [] };
        parent.children.push(liNode);
        stack.push(liNode);
      }
      i = closeIndex;
      continue;
    }

    const tagNode: TagNode = {
      type: 'tag',
      name: descriptor.name,
      value: descriptor.value,
      children: [],
    };

    const parent = stack[stack.length - 1];
    parent.children.push(tagNode);

    if (!descriptor.selfClosing && !SELF_CLOSING_TAGS.has(descriptor.name)) {
      stack.push(tagNode);
    }

    i = closeIndex;
  }

  if (buffer) {
    root.children.push({ type: 'text', content: buffer });
  }

  return root.children;
}

function parseTagDescriptor(raw: string) {
  const trimmed = raw.trim();
  const isClosing = trimmed.startsWith('/');
  const content = isClosing ? trimmed.slice(1) : trimmed;
  if (!content) return null;

  let name = '';
  let value: string | undefined;
  let rest = '';
  const firstSpace = content.search(/\s/);
  const firstEq = content.indexOf('=');
  let splitIndex = content.length;

  if (firstEq !== -1 && (firstSpace === -1 || firstEq < firstSpace)) {
    splitIndex = firstEq;
  } else if (firstSpace !== -1) {
    splitIndex = firstSpace;
  }

  name = content.slice(0, splitIndex).trim().toLowerCase();
  rest = content.slice(splitIndex).trim();

  if (rest.startsWith('=')) {
    value = rest.slice(1).trim();
  } else if (rest) {
    value = rest.trim();
  }

  if (!name) return null;

  return {
    name,
    value: stripQuotes(value),
    selfClosing: trimmed.endsWith('/'),
  };
}

function stripQuotes(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function renderNode(node: BbcodeNode, context: RenderContext = {}): string {
  if (node.type === 'text') {
    const trimmed = node.content;
    if (!trimmed.replace(/\s/g, '')) {
      return '';
    }
    const needsBreaks = context.parentTag
      ? !TABLE_TAGS.has(context.parentTag)
      : true;
    const safe = escapeHtml(trimmed);
    return needsBreaks ? safe.replace(/\r\n|\r|\n/g, '<br />') : safe;
  }

  const normalizedName = node.name.toLowerCase();
  const renderer = TAG_RENDERERS[normalizedName];
  if (renderer) {
    const renderChildren = (overrides?: Partial<RenderContext>) => {
      const childContext: RenderContext = {
        ...context,
        tableClassSlug: overrides?.tableClassSlug ?? context.tableClassSlug,
        parentTag: node.name.toLowerCase(),
        ...overrides,
      };
      return node.children.map((child) => renderNode(child, childContext)).join('');
    };
    return renderer(node, renderChildren, context);
  }

  return node.children.map((child) => renderNode(child, { ...context, parentTag: node.name.toLowerCase() })).join('');
}

type RenderChildren = (overrides?: Partial<RenderContext>) => string;
type Renderer = (node: TagNode, renderChildren: RenderChildren, context: RenderContext) => string;

const TABLE_TAGS = new Set(['table', 'tr', 'td', 'th']);

const TAG_RENDERERS: Record<string, Renderer> = {
  b: (_node, renderChildren) => `<strong>${renderChildren()}</strong>`,
  i: (_node, renderChildren) => `<em>${renderChildren()}</em>`,
  u: (_node, renderChildren) => `<u>${renderChildren()}</u>`,
  s: (_node, renderChildren) => `<s>${renderChildren()}</s>`,
  strike: (_node, renderChildren) => `<s>${renderChildren()}</s>`,
  strong: (_node, renderChildren) => `<strong>${renderChildren()}</strong>`,
  em: (_node, renderChildren) => `<em>${renderChildren()}</em>`,
  color: (node, renderChildren) => {
    const color = sanitizeColor(node.value);
    if (!color) return renderChildren();
    return `<span style="color:${color}">${renderChildren()}</span>`;
  },
  size: (node, renderChildren) => {
    const fontSize = deriveFontSize(node.value);
    return `<span style="font-size:${fontSize}px">${renderChildren()}</span>`;
  },
  font: (node, renderChildren) => {
    const family = sanitizeFontFamily(node.value);
    if (!family) return renderChildren();
    return `<span style="font-family:${family}">${renderChildren()}</span>`;
  },
  url: (node, renderChildren) => {
    const href = sanitizeUrl(node.value || renderChildren()) || '#';
    const label = renderChildren() || escapeHtml(href);
    return `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`;
  },
  img: (node, renderChildren) => {
    const source = sanitizeUrl(node.value || extractText(node.children)) || null;
    if (!source) return '';
    const alt = extractText(node.children) || 'image';
    return `<img src="${source}" alt="${escapeHtml(alt)}" />`;
  },
  quote: (_node, renderChildren) => `<blockquote>${renderChildren()}</blockquote>`,
  center: (_node, renderChildren) => `<div style="text-align:center">${renderChildren()}</div>`,
  left: (_node, renderChildren) => `<div style="text-align:left">${renderChildren()}</div>`,
  right: (_node, renderChildren) => `<div style="text-align:right">${renderChildren()}</div>`,
  indent: (node, renderChildren) => {
    const depth = Number(node.value);
    const margin = Number.isFinite(depth) ? Math.min(8, Math.max(1, depth)) * 1.5 : 1.5;
    return `<div style="margin-left:${margin}rem">${renderChildren()}</div>`;
  },
  list: (node, renderChildren) => {
    const type = node.value?.toLowerCase();
    const ordered = type === '1' || type === 'a' || type === 'i';
    const tag = ordered ? 'ol' : 'ul';
    const typeAttr = ordered && type !== '1' ? ` type="${type}"` : '';
    const items = node.children
      .map((child) => (child.type === 'tag' && child.name === 'li' ? renderNode(child) : ''))
      .join('');
    return `<${tag}${typeAttr}>${items}</${tag}>`;
  },
  li: (_node, renderChildren) => `<li>${renderChildren()}</li>`,
  table: (node, renderChildren, context) => {
    const { attrs, childSlug } = buildTableAttributes(node.value, 'table', context);
    return `<table${attrs}>${renderChildren({ tableClassSlug: childSlug ?? null })}</table>`;
  },
  tr: (node, renderChildren, context) => {
    const { attrs } = buildTableAttributes(node.value, 'tr', context);
    return `<tr${attrs}>${renderChildren()}</tr>`;
  },
  td: (node, renderChildren, context) => {
    const { attrs } = buildTableAttributes(node.value, 'td', context);
    return `<td${attrs}>${renderChildren()}</td>`;
  },
  hr: () => '<hr />',
  br: () => '<br />',
  code: (_node, renderChildren) => `<pre><code>${renderChildren()}</code></pre>`,
};

function extractText(nodes: BbcodeNode[]): string {
  return nodes
    .map((child) => {
      if (child.type === 'text') return child.content;
      return extractText(child.children);
    })
    .join('')
    .trim();
}

function sanitizeColor(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  if (/^[a-z]+$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

function deriveFontSize(value?: string) {
  const base = Number(value);
  if (Number.isFinite(base)) {
    return Math.min(40, Math.max(10, base * 4 + 8));
  }
  const keywords: Record<string, number> = {
    small: 12,
    normal: 16,
    large: 20,
    huge: 28,
  };
  return keywords[value?.toLowerCase() ?? 'normal'] ?? 16;
}

type TableAttrResult = {
  attrs: string;
  childSlug?: string | null;
};

function buildTableAttributes(
  value: string | undefined,
  tagName: 'table' | 'tr' | 'td',
  context: RenderContext
): TableAttrResult {
  const attributes: string[] = [];
  const styleFragments = new Map<string, string>();
  let widthAttr: string | null = null;
  let alignAttr: string | null = null;
  let valignAttr: string | null = tagName === 'tr' || tagName === 'td' ? 'top' : null;
  let slugOverride: string | null = null;

  if (value) {
    const pairs = value
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);

    pairs.forEach((pair) => {
      const [rawKey, rawVal] = pair.split(/:/).map((token) => token.trim());
      if (!rawVal) return;
      const key = rawKey.toLowerCase();

      if (key === 'width') {
        const safeWidth = sanitizeLength(rawVal);
        if (safeWidth) {
          widthAttr = safeWidth;
        }
      } else if (key === 'align') {
        const safeAlign = sanitizeAlign(rawVal);
        if (safeAlign) {
          alignAttr = safeAlign;
        }
      } else if (key === 'valign') {
        const safeValign = sanitizeVerticalAlign(rawVal);
        if (safeValign) {
          valignAttr = safeValign;
        }
      } else if (key === 'bgcolor' || key === 'background' || key === 'background-color') {
        const color = sanitizeColor(rawVal);
        if (color) {
          styleFragments.set('background-color', color);
        }
      } else if (key === 'class') {
        const slug = slugifyClass(rawVal);
        if (slug) {
          slugOverride = slug;
        }
      }
    });
  }

  if (widthAttr) {
    attributes.push(` width="${widthAttr}"`);
  } else if (tagName === 'table' && !widthAttr) {
    attributes.push(' width="100%"');
  }

  if (alignAttr) {
    attributes.push(` align="${alignAttr}"`);
  } else if (tagName === 'table') {
    attributes.push(' align="center"');
  }

  if (valignAttr) {
    attributes.push(` valign="${valignAttr}"`);
  }

  const effectiveSlug =
    tagName === 'table' ? slugOverride ?? null : slugOverride ?? context.tableClassSlug ?? null;
    
  const styleString = Array.from(styleFragments.entries())
    .map(([prop, val]) => `${prop}:${val}`)
    .join(';');
  if (styleString) {
    attributes.push(` style="${styleString}"`);
  }

  return {
    attrs: attributes.join(''),
    childSlug: tagName === 'table' ? effectiveSlug : undefined,
  };
}

function sanitizeFontFamily(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[^a-z0-9 ,\-_]/gi, '');
  return safe || null;
}

function sanitizeLength(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('%')) {
    const numeric = parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(numeric)) return null;
    return `${Math.min(100, Math.max(1, numeric))}%`;
  }
  const numeric = parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return null;
  return `${Math.max(1, Math.min(2000, numeric))}`;
}

function sanitizeAlign(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'left' || normalized === 'right' || normalized === 'center') {
    return normalized;
  }
  return null;
}

function sanitizeVerticalAlign(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'top' || normalized === 'middle' || normalized === 'bottom') {
    return normalized;
  }
  return 'top';
}

function slugifyClass(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/[^a-z0-9]+/g, '_');
}
