'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import Textarea from '@/components/Textarea';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type FieldType = 'text' | 'textarea' | 'select';
type FieldTransform = 'raw' | 'bbc_list';

type TemplateGroup =
  | 'application'
  | 'reinstatement'
  | 'trainings'
  | 'employee_profile_creation'
  | 'employee_profile_update'
  | 'supervision';

type TemplateRow = {
  id: string;
  status: string;
  template_code: string;
};

type TemplateFieldRow = {
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

type TemplateFieldDraft = {
  id?: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder: string;
  default_value: string;
  transform: FieldTransform;
  optionsText: string;
  sort_order: number;
};

const PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
const LIST_LIKE_KEYS = new Set(['reasons', 'observations', 'action_items']);

const titleizeKey = (key: string) => {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const extractPlaceholders = (templateCode: string) => {
  const matches = templateCode.matchAll(PLACEHOLDER_REGEX);
  const keys = new Set<string>();
  for (const match of matches) {
    const key = match[1];
    if (key) keys.add(key);
  }
  return Array.from(keys);
};

const normalizeOptions = (optionsText: string) => {
  return optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const GROUP_OPTIONS: { value: TemplateGroup; label: string }[] = [
  { value: 'application', label: 'Applications' },
  { value: 'reinstatement', label: 'Reinstatements' },
  { value: 'trainings', label: 'Trainings' },
  { value: 'employee_profile_creation', label: 'Employee Profile (Creation)' },
  { value: 'employee_profile_update', label: 'Employee Profile (Update)' },
  { value: 'supervision', label: 'Supervisions' },
];

export default function CommanderBBCTemplatesPage() {
  const [group, setGroup] = useState<TemplateGroup>('application');
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState<TemplateFieldDraft[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsSaving, setFieldsSaving] = useState(false);

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('bbc_templates')
          .select('id,status,template_code')
          .eq('template_group', group)
          .order('status');
        if (error) {
          toast.error(error.message || 'Failed to load templates');
          setRows([]);
          setSelectedId('');
          setDraft('');
          return;
        }
        const list = (data ?? []) as TemplateRow[];
        setRows(list);
        const first = list[0]?.id ?? '';
        setSelectedId(first);
        setDraft(list.find((r) => r.id === first)?.template_code ?? '');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [group]);

  useEffect(() => {
    if (!selectedRow) {
      setDraft('');
      setFields([]);
      return;
    }
    setDraft(selectedRow.template_code);
  }, [selectedRow?.id]);

  useEffect(() => {
    const loadFields = async () => {
      if (!selectedRow) return;
      setFieldsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('bbc_template_fields')
          .select('id, template_id, field_key, label, field_type, required, placeholder, default_value, transform, options, sort_order')
          .eq('template_id', selectedRow.id)
          .order('sort_order', { ascending: true })
          .order('field_key', { ascending: true });

        if (error) {
          toast.error(error.message || 'Failed to load template fields');
          setFields([]);
          return;
        }

        const rows = (data ?? []) as TemplateFieldRow[];
        setFields(
          rows.map((row) => ({
            id: row.id,
            field_key: row.field_key,
            label: row.label,
            field_type: row.field_type,
            required: Boolean(row.required),
            placeholder: row.placeholder ?? '',
            default_value: row.default_value ?? '',
            transform: row.transform,
            optionsText: (row.options ?? []).join('\n'),
            sort_order: Number(row.sort_order) || 0,
          })),
        );
      } finally {
        setFieldsLoading(false);
      }
    };

    loadFields();
  }, [selectedRow?.id]);

  const handleSave = async () => {
    if (!selectedRow) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('bbc_templates')
        .update({ template_code: draft })
        .eq('id', selectedRow.id);

      if (error) {
        toast.error(error.message || 'Failed to save template');
        return;
      }

      setRows((prev) => prev.map((r) => (r.id === selectedRow.id ? { ...r, template_code: draft } : r)));
      toast.success('Saved');
    } finally {
      setSaving(false);
    }
  };

  const detectedKeys = useMemo(() => {
    return extractPlaceholders(draft);
  }, [draft]);

  const addMissingFields = () => {
    if (!selectedRow) return;
    const existing = new Set(fields.map((f) => f.field_key));
    const missing = detectedKeys.filter((key) => !existing.has(key));
    if (missing.length === 0) {
      toast.success('No missing variables');
      return;
    }

    const maxOrder = fields.reduce((acc, f) => Math.max(acc, f.sort_order), 0);
    const next = [...fields];
    missing.forEach((key, index) => {
      const isList = LIST_LIKE_KEYS.has(key);
      next.push({
        field_key: key,
        label: titleizeKey(key),
        field_type: isList ? 'textarea' : 'text',
        required: false,
        placeholder: '',
        default_value: '',
        transform: isList ? 'bbc_list' : 'raw',
        optionsText: '',
        sort_order: maxOrder + index + 1,
      });
    });

    setFields(next);
    toast.success(`Added ${missing.length} field(s)`);
  };

  const updateField = (index: number, patch: Partial<TemplateFieldDraft>) => {
    setFields((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFields = async () => {
    if (!selectedRow) return;
    setFieldsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: existingRows, error: loadErr } = await supabase
        .from('bbc_template_fields')
        .select('id, field_key')
        .eq('template_id', selectedRow.id);

      if (loadErr) {
        toast.error(loadErr.message || 'Failed to load existing fields');
        return;
      }

      const existingByKey = new Map<string, { id: string; field_key: string }>(
        ((existingRows ?? []) as { id: string; field_key: string }[]).map((row) => [row.field_key, row]),
      );

      const payload = fields.map((field) => {
        const fieldKey = field.field_key.trim();
        const id = existingByKey.get(fieldKey)?.id ?? field.id;
        const options = field.field_type === 'select' ? normalizeOptions(field.optionsText) : [];

        const base = {
          template_id: selectedRow.id,
          field_key: fieldKey,
          label: field.label.trim() || titleizeKey(fieldKey),
          field_type: field.field_type,
          required: Boolean(field.required),
          placeholder: field.placeholder.trim() || null,
          default_value: field.default_value || null,
          transform: field.transform,
          options: options.length ? options : null,
          sort_order: Number.isFinite(field.sort_order) ? field.sort_order : 0,
        };

        // IMPORTANT: never send id: null/undefined (PostgREST may treat it as NULL and violate NOT NULL)
        return id ? { id, ...base } : base;
      });

      const { error: upsertErr } = await supabase
        .from('bbc_template_fields')
        .upsert(payload, { onConflict: 'template_id,field_key' });

      if (upsertErr) {
        toast.error(upsertErr.message || 'Failed to save fields');
        return;
      }

      const currentKeys = new Set(fields.map((f) => f.field_key.trim()));
      const toDelete = Array.from(existingByKey.values())
        .filter((row) => !currentKeys.has(row.field_key))
        .map((row) => row.id);

      if (toDelete.length) {
        const { error: deleteErr } = await supabase.from('bbc_template_fields').delete().in('id', toDelete);
        if (deleteErr) {
          toast.error(deleteErr.message || 'Failed to delete removed fields');
          return;
        }
      }

      toast.success('Fields saved');
    } finally {
      setFieldsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Commander tools</p>
            <h1 className="text-2xl font-bold text-foreground">BBC Templates Editor</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4">
              <div className="space-y-4">
                <Select
                  label="Process"
                  value={group}
                  onChange={(e) => setGroup(e.target.value as TemplateGroup)}
                  options={GROUP_OPTIONS}
                />

                <Select
                  label="Status"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  options={rows.map((r) => ({ value: r.id, label: r.status }))}
                />

                {loading && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8">
              <Textarea
                label="Template Code"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[420px] font-mono"
                placeholder="Template code"
                disabled={!selectedRow}
              />

              <div className="mt-4 rounded-md border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Detected variables</p>
                    <p className="text-xs text-muted-foreground">
                      {detectedKeys.length === 0
                        ? 'No {{variables}} detected in this template.'
                        : `Found ${detectedKeys.length} variable(s) in the template.`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={addMissingFields}
                    disabled={!selectedRow || detectedKeys.length === 0}
                  >
                    Sync fields from template
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {fieldsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading fields…</p>
                  ) : fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fields configured yet.</p>
                  ) : (
                    fields
                      .slice()
                      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.field_key.localeCompare(b.field_key))
                      .map((field, index) => (
                        <div key={`${field.field_key}-${index}`} className="rounded-md border border-border bg-card p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-3">
                              <Input
                                label="Key"
                                value={field.field_key}
                                onChange={(e) => updateField(index, { field_key: e.target.value })}
                                placeholder="e.g. applicant_name"
                              />
                            </div>

                            <div className="md:col-span-4">
                              <Input
                                label="Label"
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                placeholder={titleizeKey(field.field_key)}
                              />
                            </div>

                            <div className="md:col-span-3">
                              <Select
                                label="Type"
                                value={field.field_type}
                                onChange={(e) => {
                                  const nextType = e.target.value as FieldType;
                                  const nextTransform: FieldTransform =
                                    nextType === 'textarea' && LIST_LIKE_KEYS.has(field.field_key) ? 'bbc_list' : field.transform;
                                  updateField(index, { field_type: nextType, transform: nextTransform });
                                }}
                                options={[
                                  { value: 'text', label: 'Text' },
                                  { value: 'textarea', label: 'Textarea' },
                                  { value: 'select', label: 'Select' },
                                ]}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Input
                                label="Order"
                                type="number"
                                value={String(field.sort_order ?? 0)}
                                onChange={(e) => updateField(index, { sort_order: Number(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                              <Input
                                label="Placeholder"
                                value={field.placeholder}
                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              />
                            </div>

                            <div className="md:col-span-4">
                              <Input
                                label="Default"
                                value={field.default_value}
                                onChange={(e) => updateField(index, { default_value: e.target.value })}
                              />
                            </div>

                            <div className="md:col-span-4">
                              <Select
                                label="Transform"
                                value={field.transform}
                                onChange={(e) => updateField(index, { transform: e.target.value as FieldTransform })}
                                options={[
                                  { value: 'raw', label: 'Raw' },
                                  { value: 'bbc_list', label: 'BBC List' },
                                ]}
                              />
                            </div>
                          </div>

                          {field.field_type === 'select' ? (
                            <div className="mt-4">
                              <Textarea
                                label="Options (one per line)"
                                value={field.optionsText}
                                onChange={(e) => updateField(index, { optionsText: e.target.value })}
                                className="min-h-[120px] font-mono"
                              />
                            </div>
                          ) : null}

                          <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                            <Checkbox
                              label="Required"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                            />

                            <Button variant="outline" onClick={() => removeField(index)}>
                              Remove field
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-4 flex gap-3 flex-wrap">
                  <Button
                    onClick={handleSaveFields}
                    disabled={!selectedRow || fieldsLoading || fieldsSaving}
                  >
                    {fieldsSaving ? 'Saving fields…' : 'Save Fields'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={handleSave} disabled={!selectedRow || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDraft(selectedRow?.template_code ?? '')}
                  disabled={!selectedRow || saving}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
