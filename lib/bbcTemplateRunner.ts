export type FieldType = 'text' | 'textarea' | 'select';
export type FieldTransform = 'raw' | 'bbc_list';

export type TemplateRow = {
  id: string;
  process_type: string;
  template_code: string;
};

export type TemplateFieldRow = {
  id: string;
  template_id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder: string | null;
  default_value: string | null;
  transform: FieldTransform;
  options: string[] | null;
  sort_order: number;
};

const PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export const extractPlaceholders = (templateCode: string) => {
  const matches = templateCode.matchAll(PLACEHOLDER_REGEX);
  const keys = new Set<string>();
  for (const match of matches) {
    const key = match[1];
    if (key) keys.add(key);
  }
  return Array.from(keys);
};

export const listToBbc = (raw: string) => {
  const rows = raw
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length === 0) return 'N/A';
  return `[LIST]\n${rows.map((row) => `[*] ${row}`).join('\n')}\n[/LIST]`;
};

export const applyTransform = (value: string, transform: FieldTransform) => {
  if (transform === 'bbc_list') return listToBbc(value);
  return value;
};

export const fillTemplate = (template: string, values: Record<string, string>) => {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

export const buildValuesMap = (params: {
  template: TemplateRow;
  fields: TemplateFieldRow[];
  inputValues: Record<string, string>;
  providedValues?: Record<string, string>;
}) => {
  const { template, fields, inputValues, providedValues } = params;

  const placeholders = extractPlaceholders(template.template_code);
  const fieldsByKey = new Map(fields.map((f) => [f.field_key, f] as const));

  const values: Record<string, string> = {};
  for (const key of placeholders) {
    if (providedValues && key in providedValues) {
      values[key] = providedValues[key] ?? '';
      continue;
    }

    const field = fieldsByKey.get(key);
    const raw = inputValues[key] ?? field?.default_value ?? '';
    const transform = field?.transform ?? 'raw';
    values[key] = applyTransform(raw, transform);
  }

  return values;
};
