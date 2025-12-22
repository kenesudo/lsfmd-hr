'use client';

import BbcodePreview from '@/components/BbcodePreview';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { renderBbcode } from '@/lib/bbcode';
import {
  buildValuesMap,
  extractPlaceholders,
  fillTemplate,
  type TemplateFieldRow,
  type TemplateRow
} from '@/lib/bbcTemplateRunner';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type TemplateGroup =
  | 'application'
  | 'reinstatement'
  | 'trainings'
  | 'employee_profile_creation'
  | 'employee_profile_update'
  | 'supervision';

export type StatusOption = { value: string; label: string };

type DynamicBbcTemplateRunnerProps = {
  templateGroup: TemplateGroup;
  title: string;
  description?: string;

  initialStatus?: string;
  statusLabel?: string;
  statusOptions?: StatusOption[];

  providedValues?: Record<string, string>;

  onGeneratedChange?: (generatedBBC: string) => void;
  onStatusChange?: (status: string) => void;

  primaryActionLabel?: string;
  onPrimaryAction?: (params: { generatedBBC: string; template: TemplateRow; inputValues: Record<string, string> }) => Promise<void>;
};

const isListLikeKey = (key: string) => {
  return key === 'reasons' || key === 'observations' || key === 'action_items';
};

const buildDefaultForField = (field: TemplateFieldRow) => {
  if (typeof field.default_value === 'string' && field.default_value.length > 0) {
    return field.default_value;
  }
  if (field.transform === 'bbc_list' || isListLikeKey(field.field_key)) {
    return '';
  }
  return '';
};

export default function DynamicBbcTemplateRunner(props: DynamicBbcTemplateRunnerProps) {
  const {
    templateGroup,
    title,
    description,
    initialStatus,
    statusLabel = 'Status',
    statusOptions,
    providedValues,
    onGeneratedChange,
    onStatusChange,
    primaryActionLabel = 'Save Activity',
    onPrimaryAction,
  } = props;

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const [fields, setFields] = useState<TemplateFieldRow[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copiedBBC, setCopiedBBC] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (onStatusChange) onStatusChange(selectedStatus);
  }, [selectedStatus, onStatusChange]);

  useEffect(() => {
    if (onGeneratedChange) onGeneratedChange(generatedBBC);
  }, [generatedBBC, onGeneratedChange]);

  useEffect(() => {
    const load = async () => {
      setLoadingTemplates(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('bbc_templates')
          .select('id, status, template_code')
          .eq('template_group', templateGroup)
          .order('status');

        if (error) {
          toast.error(error.message || 'Failed to load BBC templates');
          setTemplates([]);
          setSelectedStatus('');
          return;
        }

        const list = (data ?? []) as TemplateRow[];
        setTemplates(list);
      } finally {
        setLoadingTemplates(false);
      }
    };

    load();
  }, [templateGroup]);

  useEffect(() => {
    if (!templates.length) return;

    setSelectedStatus((prev) => {
      if (prev) return prev;
      const defaultStatus = templates[0]?.status ?? '';
      return defaultStatus;
    });
  }, [templates]);

  useEffect(() => {
    if (!initialStatus) return;
    if (!templates.some((t) => t.status === initialStatus)) return;
    setSelectedStatus((prev) => (prev === initialStatus ? prev : initialStatus));
  }, [initialStatus, templates]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.status === selectedStatus) ?? null;
  }, [templates, selectedStatus]);

  const effectiveStatusOptions: StatusOption[] = useMemo(() => {
    if (statusOptions && statusOptions.length) return statusOptions;
    return templates.map((t) => ({ value: t.status, label: t.status }));
  }, [statusOptions, templates]);

  const placeholders = useMemo(() => {
    if (!selectedTemplate) return [];
    return extractPlaceholders(selectedTemplate.template_code);
  }, [selectedTemplate?.id, selectedTemplate?.template_code]);

  useEffect(() => {
    const loadFields = async () => {
      if (!selectedTemplate) {
        setFields([]);
        return;
      }

      setLoadingFields(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('bbc_template_fields')
          .select('id, template_id, field_key, label, field_type, required, placeholder, default_value, transform, options, sort_order')
          .eq('template_id', selectedTemplate.id)
          .order('sort_order', { ascending: true })
          .order('field_key', { ascending: true });

        if (error) {
          toast.error(error.message || 'Failed to load template fields');
          setFields([]);
          return;
        }

        const rows = (data ?? []) as TemplateFieldRow[];
        setFields(rows);

        const initialValues: Record<string, string> = {};
        for (const field of rows) {
          initialValues[field.field_key] = buildDefaultForField(field);
        }
        setInputValues((prev) => ({ ...initialValues, ...prev }));
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [selectedTemplate?.id]);

  const fieldsByKey = useMemo(() => {
    return new Map(fields.map((f) => [f.field_key, f] as const));
  }, [fields]);

  const missingFieldKeys = useMemo(() => {
    const missing: string[] = [];
    for (const key of placeholders) {
      if (providedValues && key in providedValues) continue;
      if (!fieldsByKey.has(key)) missing.push(key);
    }
    return missing;
  }, [placeholders, providedValues, fieldsByKey]);

  const editableFields = useMemo(() => {
    const providedKeys = new Set(Object.keys(providedValues ?? {}));
    return fields
      .filter((f) => placeholders.includes(f.field_key))
      .filter((f) => !providedKeys.has(f.field_key))
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.field_key.localeCompare(b.field_key));
  }, [fields, placeholders]);

  const setValue = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const canGenerate = Boolean(selectedTemplate) && missingFieldKeys.length === 0;

  const generate = () => {
    if (!selectedTemplate) return;
    if (missingFieldKeys.length) {
      toast.error(`Missing field definitions: ${missingFieldKeys.join(', ')}`);
      return;
    }

    const values = buildValuesMap({
      template: selectedTemplate,
      fields,
      inputValues,
      providedValues,
    });

    const filled = fillTemplate(selectedTemplate.template_code, values);
    setGeneratedBBC(filled);
  };

  const handleCopy = async () => {
    try {
      if (!generatedBBC) return;
      await navigator.clipboard.writeText(generatedBBC);
      setCopiedBBC(true);
      setTimeout(() => setCopiedBBC(false), 2000);
      toast.success('BBC copied');
    } catch {
      toast.error('Failed to copy BBC');
    }
  };

  const handlePrimaryAction = async () => {
    if (!selectedTemplate || !onPrimaryAction) return;
    if (!generatedBBC) {
      toast.error('Generate the BBC output first.');
      return;
    }

    setWorking(true);
    try {
      await onPrimaryAction({ generatedBBC, template: selectedTemplate, inputValues });
    } finally {
      setWorking(false);
    }
  };

  const renderFieldInput = (field: TemplateFieldRow) => {
    const value = inputValues[field.field_key] ?? '';
    const label = field.label || field.field_key;

    const missingRequired = field.required && !value.trim();

    if (field.field_type === 'textarea') {
      return (
        <Textarea
          key={field.field_key}
          label={label}
          value={value}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => setValue(field.field_key, e.target.value)}
          error={missingRequired ? 'Required' : undefined}
          className={isListLikeKey(field.field_key) ? 'min-h-[140px]' : undefined}
        />
      );
    }

    if (field.field_type === 'select') {
      const options = (field.options ?? []).map((o) => ({ value: o, label: o }));
      return (
        <Select
          key={field.field_key}
          label={label}
          value={value}
          onChange={(e) => setValue(field.field_key, e.target.value)}
          options={options}
          error={missingRequired ? 'Required' : undefined}
        />
      );
    }

    return (
      <Input
        key={field.field_key}
        label={label}
        value={value}
        placeholder={field.placeholder ?? undefined}
        onChange={(e) => setValue(field.field_key, e.target.value)}
        error={missingRequired ? 'Required' : undefined}
      />
    );
  };

  const requiredNotFilled = useMemo(() => {
    return editableFields.some((field) => field.required && !(inputValues[field.field_key] ?? '').trim());
  }, [editableFields, inputValues]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">{description ?? 'Fill fields to generate the BBC output.'}</p>
          <h2 className="text-xl font-semibold text-foreground mt-2">{title}</h2>
        </div>

        <div className="space-y-4">
          <Select
            label={statusLabel}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={effectiveStatusOptions}
            disabled={loadingTemplates || effectiveStatusOptions.length === 0}
          />

          {loadingFields ? <p className="text-sm text-muted-foreground">Loading fields…</p> : null}

          {missingFieldKeys.length ? (
            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
              Missing field definitions in BBC Templates editor:
              <div className="mt-2 font-mono text-xs whitespace-pre-wrap">{missingFieldKeys.join('\n')}</div>
            </div>
          ) : null}

          {editableFields.map(renderFieldInput)}

          <Button
            onClick={generate}
            disabled={!canGenerate || requiredNotFilled || loadingTemplates || loadingFields}
            className="w-full"
          >
            Generate
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleCopy} disabled={!generatedBBC} variant="outline" className="flex-1">
            {copiedBBC ? '✓ Copied!' : 'Copy BBC'}
          </Button>
          {onPrimaryAction ? (
            <Button
              onClick={handlePrimaryAction}
              disabled={!generatedBBC || working}
              variant="primary"
              className="flex-1"
            >
              {working ? 'Working…' : primaryActionLabel}
            </Button>
          ) : null}
        </div>

        {generatedBBC ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md h-[600px]">
              <BbcodePreview html={renderBbcode(generatedBBC)} title="BBC preview" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Raw BBC</p>
              <div className="rounded-md border border-dashed border-border bg-background p-3 font-mono text-[11px] text-foreground whitespace-pre-wrap">
                {generatedBBC}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
            Generate a template to preview the BBC output.
          </div>
        )}
      </div>
    </div>
  );
}
