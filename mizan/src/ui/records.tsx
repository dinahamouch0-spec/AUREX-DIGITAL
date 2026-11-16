/**
 * Generic, schema-driven record form and list. Every create/edit screen for
 * ordinary records uses these, so validation, labels, confirmation, undo and
 * UI states are consistent across the five domains.
 */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { formToRecord, FormState, recordToForm } from '../domain/formValues';
import { isCurrency } from '../domain/money';
import { FieldSpec, SCHEMAS, ValidationError } from '../domain/schema';
import type { CollectionName } from '../domain/types';
import { Formatters } from '../i18n';
import { store, useApp, useCollection, useStoreVersion } from '../state/AppContext';
import { spacing } from '../theme/tokens';
import { BooleanField, DateField, DateTimeField, RatingField, SelectField, TextField, WeekdaysField } from './fields';
import { Badge, Button, EmptyState, ListItem, Notice, Row, SectionHeader } from './primitives';

type T = (k: string, p?: Record<string, string | number>) => string;

export function optionLabel(t: T, field: FieldSpec, value: string): string {
  if (field.optionPrefix) return t(`opt.${field.optionPrefix}.${value}`);
  return value;
}

/** Human title for any record. */
export function recordTitle(collection: CollectionName, row: Record<string, unknown> | undefined, t: T, fmt: Formatters): string {
  if (!row) return t('common.unknownRecord');
  const schema = SCHEMAS[collection];
  const field = schema.fields.find((f) => f.name === schema.titleField);
  const v = row[schema.titleField];
  if (v == null || v === '') {
    if (collection === 'meal_items') return String(row.custom_name ?? t('common.untitled'));
    return t('common.untitled');
  }
  if (field?.type === 'select') {
    const base = optionLabel(t, field, String(v));
    if (collection === 'adhkar_logs' && row.custom_label) return String(row.custom_label);
    return base;
  }
  if (field?.type === 'datetime' || schema.titleField.endsWith('_at')) return fmt.dateTime(String(v));
  if (field?.type === 'date' || schema.titleField.endsWith('_date') || schema.titleField.endsWith('_on')) return fmt.localDate(String(v));
  if (collection === 'hydration_logs') return `${fmt.number(Number(v))} ml`;
  return String(v);
}

/** Short secondary line for list rows. */
export function recordSubtitle(collection: CollectionName, row: Record<string, unknown>, t: T, fmt: Formatters): string {
  const schema = SCHEMAS[collection];
  const parts: string[] = [];
  const statusField = schema.fields.find((f) => f.type === 'select' && ['status', 'stage', 'mastery_status', 'direction', 'meal_type', 'category', 'channel'].includes(f.name) && f.name !== schema.titleField);
  if (statusField && row[statusField.name]) parts.push(optionLabel(t, statusField, String(row[statusField.name])));
  if (schema.dateField && schema.dateField !== schema.titleField && row[schema.dateField]) {
    const v = String(row[schema.dateField]);
    parts.push(v.length > 10 ? fmt.dateTime(v) : fmt.localDate(v));
  }
  const money = schema.fields.find((f) => f.type === 'money');
  if (money && typeof row[money.name] === 'number' && isCurrency(row.currency)) parts.push(fmt.money(row[money.name] as number, row.currency));
  return parts.join(' · ');
}

function useRefOptions(collection: CollectionName | undefined) {
  const { t, fmt } = useApp();
  const rows = useCollection((collection ?? 'goals') as CollectionName) as unknown as Record<string, unknown>[];
  return useMemo(
    () => (collection ? rows.map((r) => ({ value: r.id as string, label: recordTitle(collection, r, t, fmt) })) : []),
    [rows, collection, t, fmt],
  );
}

function RefField({ field, label, value, onChange, error, testID }: { field: FieldSpec; label: string; value: string | null; onChange: (v: string | null) => void; error?: string; testID?: string }) {
  const options = useRefOptions(field.ref);
  return <SelectField label={label} value={value} options={options} onChange={onChange} error={error} required={field.required} testID={testID} inlineMax={0} />;
}

export function FormFieldView({ collection, field, state, setValue, error }: { collection: CollectionName; field: FieldSpec; state: FormState; setValue: (name: string, v: FormState[string]) => void; error?: string }) {
  const { t, settings } = useApp();
  const label = t(`field.${field.name}`);
  const testID = `field-${field.name}`;
  const v = state[field.name];
  switch (field.type) {
    case 'text':
      return <TextField label={label} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} testID={testID} keyboardType={field.name === 'email' ? 'email-address' : field.name === 'phone' ? 'phone-pad' : 'default'} autoCapitalize={field.name === 'email' ? 'none' : 'sentences'} />;
    case 'multiline':
      return <TextField label={label} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} multiline testID={testID} />;
    case 'number':
    case 'integer':
      return <TextField label={label} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} keyboardType={field.type === 'integer' ? 'number-pad' : 'decimal-pad'} testID={testID} />;
    case 'money': {
      const cur = field.currencyField?.startsWith('@')
        ? (store.get('invoices', state.invoice_id as string)?.currency ?? '')
        : (state[field.currencyField ?? ''] as string) ?? '';
      return <TextField label={`${label}${cur ? ` (${cur})` : ''}`} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} keyboardType="decimal-pad" testID={testID} />;
    }
    case 'date':
      return <DateField label={label} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} testID={testID} />;
    case 'datetime':
      return <DateTimeField label={label} value={(v as string) ?? ''} onChange={(x) => setValue(field.name, x)} error={error} required={field.required} testID={testID} />;
    case 'select':
      return (
        <SelectField
          label={label}
          value={(v as string) ?? null}
          options={(field.options ?? []).map((o) => ({ value: o, label: optionLabel(t, field, o) }))}
          onChange={(x) => setValue(field.name, x)}
          error={error}
          required={field.required}
          testID={testID}
        />
      );
    case 'ref':
      return <RefField field={field} label={label} value={(v as string) ?? null} onChange={(x) => setValue(field.name, x)} error={error} testID={testID} />;
    case 'boolean':
      return <BooleanField label={label} value={Boolean(v)} onChange={(x) => setValue(field.name, x)} testID={testID} />;
    case 'weekdays':
      return <WeekdaysField label={label} value={(v as number[]) ?? []} onChange={(x) => setValue(field.name, x)} error={error} weekStart={settings.weekStart} />;
    case 'rating':
      return <RatingField label={label} value={v == null || v === '' ? null : Number(v)} onChange={(x) => setValue(field.name, x == null ? null : String(x))} error={error} />;
    default:
      return null;
  }
}

export function RecordForm({
  collection,
  id,
  prefill,
  onSaved,
  lockedFields = [],
  hideFields = [],
}: {
  collection: CollectionName;
  id?: string | null;
  prefill?: Record<string, unknown>;
  onSaved?: (id: string) => void;
  lockedFields?: string[];
  hideFields?: string[];
}) {
  const { t, settings, showToast, confirm } = useApp();
  useStoreVersion();
  const existing = id ? store.get(collection, id) : undefined;
  const ctx = useMemo(
    () => ({
      timeZone: settings.timezone,
      currencyFor: (_f: FieldSpec, s: FormState) => store.get('invoices', s.invoice_id as string)?.currency ?? null,
    }),
    [settings.timezone],
  );
  const [state, setState] = useState<FormState>(() => {
    const base = recordToForm(collection, (existing as unknown as Record<string, unknown>) ?? null, ctx);
    if (!existing && prefill) {
      const pre = recordToForm(collection, { ...Object.fromEntries(Object.keys(base).map((k) => [k, undefined])), ...prefill }, ctx);
      for (const [k, v] of Object.entries(prefill)) if (v !== undefined) base[k] = pre[k];
    }
    return base;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  if (id && !existing) return <EmptyState icon="document-outline" body={t('state.notFound')} />;

  const fields = SCHEMAS[collection].fields.filter((f) => !f.hidden && !hideFields.includes(f.name) && !lockedFields.includes(f.name));
  const basic = fields.filter((f) => !f.advanced);
  const advanced = fields.filter((f) => f.advanced);
  const setValue = (name: string, v: FormState[string]) => {
    setState((s) => ({ ...s, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const save = () => {
    const { values, errors: errs } = formToRecord(collection, state, ctx);
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      if (Object.keys(clean).some((k) => advanced.some((f) => f.name === k))) setShowAdvanced(true);
      return;
    }
    setSaving(true);
    try {
      // keep hidden/locked values from the record or prefill
      for (const f of SCHEMAS[collection].fields) {
        if ((f.hidden || lockedFields.includes(f.name)) && prefill && prefill[f.name] !== undefined && !existing) values[f.name] = prefill[f.name];
        if ((f.hidden || hideFields.includes(f.name)) && existing) values[f.name] = (existing as unknown as Record<string, unknown>)[f.name];
      }
      const saved = existing ? store.update(collection, existing.id, values as never) : store.insert(collection, values as never);
      showToast({ message: t('toast.saved') });
      if (onSaved) onSaved(saved.id);
      else router.back();
    } catch (e) {
      if (e instanceof ValidationError) setErrors(e.errors);
      else showToast({ message: t('toast.error'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    const ok = await confirm({ title: t('confirm.deleteTitle'), body: t('confirm.deleteBody'), confirmLabel: t('common.delete'), destructive: true });
    if (!ok) return;
    const undo = store.remove(collection, existing.id);
    showToast({ message: t('toast.deleted'), actionLabel: t('common.undo'), onAction: undo });
    router.back();
  };

  const hasErrors = Object.values(errors).some(Boolean);
  return (
    <View style={{ gap: spacing.lg }} testID={`form-${collection}`}>
      {hasErrors ? <Notice tone="danger" text={t('error.fixBelow')} /> : null}
      {basic.map((f) => (
        <FormFieldView key={f.name} collection={collection} field={f} state={state} setValue={setValue} error={errors[f.name] || undefined} />
      ))}
      {advanced.length > 0 ? (
        <Button variant="ghost" label={showAdvanced ? t('common.hideAdvanced') : t('common.showAdvanced')} onPress={() => setShowAdvanced((s) => !s)} icon={showAdvanced ? 'chevron-up' : 'chevron-down'} testID="toggle-advanced" />
      ) : null}
      {showAdvanced
        ? advanced.map((f) => <FormFieldView key={f.name} collection={collection} field={f} state={state} setValue={setValue} error={errors[f.name] || undefined} />)
        : null}
      <Row style={{ marginTop: spacing.md }}>
        <Button label={t('common.save')} onPress={save} loading={saving} style={{ flex: 1 }} testID="form-save" icon="checkmark" />
        {existing ? <Button label={t('common.delete')} variant="secondary" onPress={remove} icon="trash-outline" testID="form-delete" /> : null}
      </Row>
    </View>
  );
}

export function newRecordHref(collection: CollectionName, prefill?: Record<string, unknown>) {
  const qs = prefill ? `?prefill=${encodeURIComponent(JSON.stringify(prefill))}` : '';
  return `/records/${collection}/new${qs}`;
}
export function editRecordHref(collection: CollectionName, id: string) {
  return `/records/${collection}/${id}`;
}

export function RecordList({
  collection,
  filter,
  limit,
  title,
  emptyBody,
  prefill,
  sort,
  onPressItem,
  hideAdd,
  testID,
  subtitle,
}: {
  collection: CollectionName;
  filter?: (r: Record<string, unknown>) => boolean;
  limit?: number;
  title?: string;
  emptyBody?: string;
  prefill?: Record<string, unknown>;
  sort?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  onPressItem?: (id: string) => void;
  hideAdd?: boolean;
  testID?: string;
  subtitle?: (r: Record<string, unknown>) => string;
}) {
  const { t, fmt, session } = useApp();
  useStoreVersion();
  const rows = useCollection(collection) as unknown as Record<string, unknown>[];
  const schema = SCHEMAS[collection];
  const items = useMemo(() => {
    let r = filter ? rows.filter(filter) : [...rows];
    const sf = schema.sortField ?? 'created_at';
    r.sort(sort ?? ((a, b) => String(b[sf] ?? '').localeCompare(String(a[sf] ?? ''))));
    if (limit) r = r.slice(0, limit);
    return r;
  }, [rows, filter, sort, limit, schema.sortField]);
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      {title ? (
        <SectionHeader title={title} action={hideAdd ? undefined : t('common.add')} onAction={() => router.push(newRecordHref(collection, prefill) as never)} testID={`add-${collection}`} />
      ) : null}
      {items.length === 0 ? (
        <EmptyState body={emptyBody ?? t('state.emptyBody')} actionLabel={hideAdd || title ? undefined : t('common.add')} onAction={() => router.push(newRecordHref(collection, prefill) as never)} />
      ) : (
        items.map((r) => (
          <ListItem
            key={r.id as string}
            testID={`row-${collection}-${r.id}`}
            title={recordTitle(collection, r, t, fmt)}
            subtitle={subtitle ? subtitle(r) : recordSubtitle(collection, r, t, fmt)}
            onPress={() => (onPressItem ? onPressItem(r.id as string) : router.push(editRecordHref(collection, r.id as string) as never))}
            right={session && store.hasPending(collection, r.id as string) ? <Badge label={t('sync.status.pending')} tone="warning" /> : undefined}
          />
        ))
      )}
    </View>
  );
}
