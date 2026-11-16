import React, { useState } from 'react';
import { Pressable, Switch, TextInput, TextInputProps, View } from 'react-native';

import { addDays, isLocalDate, isTimeOfDay, localTimeOf } from '../domain/dates';
import { useApp } from '../state/AppContext';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { SelectSheet, SheetOption } from './overlays';
import { Chip, ChevronForward, Row, Txt } from './primitives';
import { usePalette } from './theme';

export function FieldShell({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  const { t } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" color="textSecondary">
        {label}
        {required ? ' *' : ''}
      </Txt>
      {children}
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="text">
          {t(`error.${error}`)}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" color="textMuted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function Input(props: TextInputProps & { invalid?: boolean }) {
  const p = usePalette();
  const { rtl } = useApp();
  const [focused, setFocused] = useState(false);
  const { invalid, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={p.textMuted}
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[
        type.body,
        {
          color: p.text,
          backgroundColor: p.surface,
          borderWidth: focused ? 2 : 1,
          borderColor: invalid ? p.danger : focused ? p.focus : p.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: MIN_TOUCH,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        rest.multiline ? { minHeight: 96, textAlignVertical: 'top' } : null,
        style,
      ]}
    />
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  multiline,
  keyboardType,
  placeholder,
  testID,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  placeholder?: string;
  testID?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
}) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <Input
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        invalid={!!error}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </FieldShell>
  );
}

export function DateField({ label, value, onChange, error, required, testID }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; testID?: string }) {
  const { t, today, fmt } = useApp();
  const valid = isLocalDate(value);
  return (
    <FieldShell label={label} error={error} required={required} hint={valid ? fmt.localDate(value, 'long') : 'YYYY-MM-DD'}>
      <Input testID={testID} accessibilityLabel={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" invalid={!!error} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      <Row wrap>
        <Chip label={t('common.today')} selected={value === today} onPress={() => onChange(today)} />
        <Chip label={t('common.tomorrow')} selected={value === addDays(today, 1)} onPress={() => onChange(addDays(today, 1))} />
        {valid ? <Chip label="−1" onPress={() => onChange(addDays(value, -1))} /> : null}
        {valid ? <Chip label="+1" onPress={() => onChange(addDays(value, 1))} /> : null}
        {!required && value ? <Chip label={t('common.clear')} onPress={() => onChange('')} /> : null}
      </Row>
    </FieldShell>
  );
}

/** Value format: "YYYY-MM-DD HH:mm" in the user's timezone ('' = empty). */
export function DateTimeField({ label, value, onChange, error, required, testID }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; testID?: string }) {
  const { t, today, fmt, settings } = useApp();
  const [date = '', time = ''] = value ? value.split(' ') : ['', ''];
  const set = (d: string, tm: string) => onChange(d || tm ? `${d} ${tm}`.trim() : '');
  const nowLocal = () => localTimeOf(new Date(), settings.timezone);
  return (
    <FieldShell label={label} error={error} required={required} hint={isLocalDate(date) ? fmt.localDate(date, 'long') : undefined}>
      <Row>
        <Input testID={testID ? `${testID}-date` : undefined} accessibilityLabel={`${label} — date`} style={{ flex: 3 }} value={date} onChangeText={(d) => set(d, time || '09:00')} placeholder="YYYY-MM-DD" invalid={!!error} autoCapitalize="none" />
        <Input testID={testID ? `${testID}-time` : undefined} accessibilityLabel={`${label} — time`} style={{ flex: 2 }} value={time} onChangeText={(tm) => set(date || today, tm)} placeholder="HH:mm" invalid={!!error || (!!time && !isTimeOfDay(time))} autoCapitalize="none" />
      </Row>
      <Row wrap>
        <Chip label={t('common.today')} selected={date === today} onPress={() => set(today, time || nowLocalSafe(nowLocal))} />
        <Chip label={t('common.tomorrow')} selected={date === addDays(today, 1)} onPress={() => set(addDays(today, 1), time || '09:00')} />
        {!required && value ? <Chip label={t('common.clear')} onPress={() => onChange('')} /> : null}
      </Row>
    </FieldShell>
  );
}

function nowLocalSafe(fn: () => string) {
  try {
    return fn();
  } catch {
    return '09:00';
  }
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  required,
  testID,
  inlineMax = 5,
}: {
  label: string;
  value: string | null;
  options: SheetOption[];
  onChange: (v: string | null) => void;
  error?: string;
  required?: boolean;
  testID?: string;
  inlineMax?: number;
}) {
  const p = usePalette();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  if (options.length <= inlineMax) {
    return (
      <FieldShell label={label} error={error} required={required}>
        <Row wrap>
          {options.map((o) => (
            <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value === value && !required ? null : o.value)} testID={testID ? `${testID}-${o.value}` : undefined} />
          ))}
        </Row>
      </FieldShell>
    );
  }
  const current = options.find((o) => o.value === value);
  return (
    <FieldShell label={label} error={error} required={required}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? t('common.select')}`}
        onPress={() => setOpen(true)}
        style={{ minHeight: MIN_TOUCH, borderWidth: 1, borderColor: error ? p.danger : p.border, borderRadius: radius.sm, backgroundColor: p.surface, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
        <Txt style={{ flex: 1 }} color={current ? 'text' : 'textMuted'}>
          {current?.label ?? t('common.select')}
        </Txt>
        <ChevronForward />
      </Pressable>
      <SelectSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        allowClear={!required}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </FieldShell>
  );
}

export function BooleanField({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const p = usePalette();
  return (
    <Row style={{ justifyContent: 'space-between', minHeight: MIN_TOUCH }}>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      <Switch testID={testID} accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: p.accent, false: p.border }} thumbColor={p.surface} />
    </Row>
  );
}

export function WeekdaysField({ label, value, onChange, error, weekStart }: { label: string; value: number[]; onChange: (v: number[]) => void; error?: string; weekStart: number }) {
  const { t } = useApp();
  const days = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
  return (
    <FieldShell label={label} error={error}>
      <Row wrap>
        {days.map((d) => (
          <Chip
            key={d}
            label={t(`weekday.${d}`)}
            selected={value.includes(d)}
            testID={`weekday-${d}`}
            onPress={() => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort())}
          />
        ))}
      </Row>
    </FieldShell>
  );
}

export function RatingField({ label, value, onChange, error }: { label: string; value: number | null; onChange: (v: number | null) => void; error?: string }) {
  return (
    <FieldShell label={label} error={error}>
      <Row wrap>
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} label={String(n)} selected={value === n} onPress={() => onChange(value === n ? null : n)} />
        ))}
      </Row>
    </FieldShell>
  );
}
