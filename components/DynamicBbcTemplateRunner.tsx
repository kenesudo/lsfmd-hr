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
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

let cachedTemplates: TemplateRow[] | null = null;
let templatesInFlight: Promise<TemplateRow[]> | null = null;

export type ProcessTypeOption = { value: string; label: string };

type DynamicBbcTemplateRunnerProps = {
  title: string;
  description?: string;

  initialProcessType?: string;
  processTypeLabel?: string;
  processTypeOptions?: ProcessTypeOption[];

  providedValues?: Record<string, string>;

  onGeneratedChange?: (generatedBBC: string) => void;
  onProcessTypeChange?: (processType: string) => void;

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
    title,
    description,
    initialProcessType,
    processTypeLabel = 'Process Type',
    processTypeOptions,
    providedValues,
    onGeneratedChange,
    onProcessTypeChange,
    primaryActionLabel = 'Save Activity',
    onPrimaryAction,
  } = props;

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState('');

  const hasLoadedTemplatesRef = useRef(false);

  const [fields, setFields] = useState<TemplateFieldRow[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const [generatedBBC, setGeneratedBBC] = useState('');
  const [copiedBBC, setCopiedBBC] = useState(false);
  const [showCopyReminder, setShowCopyReminder] = useState(false);
  const [working, setWorking] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [flickerSave, setFlickerSave] = useState(false);

  const onProcessTypeChangeRef = useRef<typeof onProcessTypeChange>(onProcessTypeChange);
  const onGeneratedChangeRef = useRef<typeof onGeneratedChange>(onGeneratedChange);

  useEffect(() => {
    onProcessTypeChangeRef.current = onProcessTypeChange;
  }, [onProcessTypeChange]);

  useEffect(() => {
    onGeneratedChangeRef.current = onGeneratedChange;
  }, [onGeneratedChange]);

  useEffect(() => {
    const cb = onProcessTypeChangeRef.current;
    if (cb) cb(selectedProcessType);
  }, [selectedProcessType]);

  useEffect(() => {
    const cb = onGeneratedChangeRef.current;
    if (cb) cb(generatedBBC);
  }, [generatedBBC]);

  useEffect(() => {
    if (!onPrimaryAction) return;
    setHasUnsavedChanges(Boolean(generatedBBC));
  }, [generatedBBC, onPrimaryAction]);

  useEffect(() => {
    if (!onPrimaryAction) return;

    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = 'Do you really want to exit? You have not saved it yet.';
    };

    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsavedChanges, onPrimaryAction]);

  useEffect(() => {
    if (!onPrimaryAction) return;

    const message = 'Do you really want to exit? You have not saved it yet.';

    const onClickCapture = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as Element | null;
      if (!target) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      const ok = window.confirm(message);
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', onClickCapture, true);
    return () => {
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [hasUnsavedChanges, onPrimaryAction]);

  useEffect(() => {
    if (hasLoadedTemplatesRef.current) return;
    hasLoadedTemplatesRef.current = true;

    if (cachedTemplates) {
      setTemplates(cachedTemplates);
      return;
    }

    const load = async () => {
      setLoadingTemplates(true);
      try {
        if (!templatesInFlight) {
          templatesInFlight = (async () => {
            const supabase = createSupabaseBrowserClient();
            const { data, error } = await supabase
              .from('bbc_templates')
              .select('id, process_type, template_code')
              .order('process_type');

            if (error) throw error;
            return (data ?? []) as TemplateRow[];
          })();
        }

        const list = await templatesInFlight;
        cachedTemplates = list;
        setTemplates(list);
      } finally {
        templatesInFlight = null;
        setLoadingTemplates(false);
      }
    };

    load().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load BBCode templates');
      cachedTemplates = null;
      templatesInFlight = null;
      setTemplates([]);
      setSelectedProcessType('');
    });
  }, []);

  useEffect(() => {
    if (!templates.length) return;

    setSelectedProcessType((prev) => {
      if (prev) return prev;
      const firstFromProp = typeof initialProcessType === 'string' ? initialProcessType : '';
      if (firstFromProp) return firstFromProp;
      const firstFromOptions = processTypeOptions?.[0]?.value ?? '';
      if (firstFromOptions) return firstFromOptions;
      const firstFromTemplates = templates[0]?.process_type ?? '';
      return firstFromTemplates;
    });
  }, [templates, initialProcessType, processTypeOptions]);

  useEffect(() => {
    if (!initialProcessType) return;
    setSelectedProcessType((prev) => (prev === initialProcessType ? prev : initialProcessType));
  }, [initialProcessType]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.process_type === selectedProcessType) ?? null;
  }, [templates, selectedProcessType]);

  const effectiveProcessTypeOptions: ProcessTypeOption[] = useMemo(() => {
    if (processTypeOptions && processTypeOptions.length) return processTypeOptions;
    return templates.map((t) => ({ value: t.process_type, label: t.process_type }));
  }, [processTypeOptions, templates]);

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
      setShowCopyReminder(true);
      setHasUnsavedChanges(true);
      if (onPrimaryAction) {
        setFlickerSave(true);
      } else {
        setTimeout(() => setShowCopyReminder(false), 7000);
      }
      toast.success('BBCode copied');
    } catch {
      toast.error('Failed to copy BBCode');
    }
  };

  const handlePrimaryAction = async () => {
    if (!selectedTemplate || !onPrimaryAction) return;
    if (!generatedBBC) {
      toast.error('Generate the BBCode output first.');
      return;
    }

    setWorking(true);
    try {
      await onPrimaryAction({ generatedBBC, template: selectedTemplate, inputValues });
      setHasUnsavedChanges(false);
      setFlickerSave(false);
      setShowCopyReminder(false);
      setCopiedBBC(false);
      setGeneratedBBC('');
      setInputValues((prev) => {
        const next = { ...prev };
        for (const field of fields) {
          next[field.field_key] = buildDefaultForField(field);
        }
        return next;
      });
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
      {showCopyReminder ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4">
          <div className="warning-blink max-w-3xl rounded-md border border-primary/20 bg-primary px-12 py-6 text-base text-primary-foreground shadow-lg">
            Don’t forget to click <span className="font-semibold">Save Activity</span> so it will be recorded.
          </div>
        </div>
      ) : null}
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">{description ?? 'Fill fields to generate the BBCode output.'}</p>
          <h2 className="text-xl font-semibold text-foreground mt-2">{title}</h2>
        </div>

        <div className="space-y-4">
          {effectiveProcessTypeOptions.length ? (
            <Select
              label={processTypeLabel}
              value={selectedProcessType}
              onChange={(e) => setSelectedProcessType(e.target.value)}
              options={effectiveProcessTypeOptions}
              disabled={loadingTemplates || effectiveProcessTypeOptions.length === 0}
            />
          ) : null}

          {loadingFields ? <p className="text-sm text-muted-foreground">Loading fields…</p> : null}

          {selectedProcessType && !selectedTemplate && !loadingTemplates ? (
            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
              No BBCode template exists yet for:
              <div className="mt-2 font-mono text-xs whitespace-pre-wrap">{selectedProcessType}</div>
            </div>
          ) : null}

          {missingFieldKeys.length ? (
            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-primary">
              Missing field definitions in BBCode Templates editor:
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
            {copiedBBC ? '✓ Copied!' : 'Copy BBCode'}
          </Button>
          {onPrimaryAction ? (
            <Button
              onClick={handlePrimaryAction}
              disabled={working || !generatedBBC}
              className={`flex-1 ${flickerSave ? 'warning-blink' : ''}`}
            >
              {working ? 'Saving…' : primaryActionLabel}
            </Button>
          ) : null}
        </div>

        {generatedBBC ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md h-[600px]">
              <BbcodePreview html={renderBbcode(generatedBBC)} title="BBCode preview" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Raw BBCode</p>
              <div className="rounded-md border border-dashed border-border bg-background p-3 font-mono text-[11px] text-foreground whitespace-pre-wrap">
                {generatedBBC}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
            Generate a template to preview the BBCode output.
          </div>
        )}
      </div>
    </div>
  );
}
