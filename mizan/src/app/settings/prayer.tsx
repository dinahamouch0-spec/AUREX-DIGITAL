import React, { useMemo, useState } from 'react';

import { formToRecord } from '@/domain/formValues';
import { CALCULATION_SOURCE, DEFAULT_PRAYER_SETTINGS, PrayerTimeKey, computePrayerTimes } from '@/domain/prayerTimes';
import { parseNumberInput } from '@/domain/formValues';
import { useApp } from '@/state/AppContext';
import { BooleanField, SelectField, TextField } from '@/ui/fields';
import { Button, Card, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';

const KEYS: PrayerTimeKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerSettings() {
  const { t, fmt, settings, updateSettings, today, showToast } = useApp();
  const s = settings.prayer;
  const [form, setForm] = useState({
    locationLabel: s.locationLabel,
    latitude: String(s.latitude),
    longitude: String(s.longitude),
    elevationM: String(s.elevationM),
    fajrAngle: String(s.fajrAngle),
    ishaAngle: String(s.ishaAngle),
    maghribAngle: s.maghribAngle == null ? '' : String(s.maghribAngle),
    asrFactor: String(s.asrFactor),
    adj: Object.fromEntries(KEYS.map((k) => [k, s.adjustments[k] ? String(s.adjustments[k]) : ''])) as Record<string, string>,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  void formToRecord;

  const parsed = useMemo(() => {
    const errs: Record<string, string> = {};
    const num = (k: string, v: string, min: number, max: number, optional = false) => {
      const n = parseNumberInput(v);
      if (n == null) {
        if (!optional) errs[k] = 'required';
        return null;
      }
      if (n === 'invalid') {
        errs[k] = 'invalid_number';
        return null;
      }
      if (n < min || n > max) errs[k] = n < min ? 'too_small' : 'too_large';
      return n;
    };
    const adjustments: Partial<Record<PrayerTimeKey, number>> = {};
    for (const k of KEYS) {
      const n = num(`adj.${k}`, form.adj[k], -60, 60, true);
      if (n) adjustments[k] = Math.round(n);
    }
    const value = {
      ...s,
      locationLabel: form.locationLabel.trim() || DEFAULT_PRAYER_SETTINGS.locationLabel,
      latitude: num('latitude', form.latitude, -66, 66) ?? s.latitude,
      longitude: num('longitude', form.longitude, -180, 180) ?? s.longitude,
      elevationM: num('elevationM', form.elevationM, 0, 5000, true) ?? 0,
      fajrAngle: num('fajrAngle', form.fajrAngle, 10, 22) ?? s.fajrAngle,
      ishaAngle: num('ishaAngle', form.ishaAngle, 10, 22) ?? s.ishaAngle,
      maghribAngle: num('maghribAngle', form.maghribAngle, 0, 10, true),
      asrFactor: (form.asrFactor === '2' ? 2 : 1) as 1 | 2,
      adjustments,
    };
    return { value, errs };
  }, [form, s]);

  const preview = computePrayerTimes(today, parsed.value);
  const save = () => {
    if (Object.keys(parsed.errs).length) {
      setErrors(parsed.errs);
      return;
    }
    setErrors({});
    updateSettings({ prayer: { ...parsed.value, confirmed: s.confirmed } });
    showToast({ message: t('toast.saved') });
  };
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Screen title={t('ps.title')} testID="screen-prayer-settings">
      <Notice text={t('ps.explain')} />
      <TextField label={t('ps.location')} value={form.locationLabel} onChange={(v) => set('locationLabel', v)} />
      <Row>
        <TextField label={t('ps.latitude')} value={form.latitude} onChange={(v) => set('latitude', v)} error={errors.latitude} keyboardType="numbers-and-punctuation" />
        <TextField label={t('ps.longitude')} value={form.longitude} onChange={(v) => set('longitude', v)} error={errors.longitude} keyboardType="numbers-and-punctuation" />
      </Row>
      <TextField label={t('ps.elevation')} value={form.elevationM} onChange={(v) => set('elevationM', v)} error={errors.elevationM} keyboardType="decimal-pad" />
      <TextField label={t('ps.fajrAngle')} value={form.fajrAngle} onChange={(v) => set('fajrAngle', v)} error={errors.fajrAngle} keyboardType="decimal-pad" />
      <TextField label={t('ps.maghribAngle')} value={form.maghribAngle} onChange={(v) => set('maghribAngle', v)} error={errors.maghribAngle} keyboardType="decimal-pad" />
      <TextField label={t('ps.ishaAngle')} value={form.ishaAngle} onChange={(v) => set('ishaAngle', v)} error={errors.ishaAngle} keyboardType="decimal-pad" />
      <SelectField label={t('ps.asrFactor')} value={form.asrFactor} required options={[{ value: '1', label: t('ps.asr1') }, { value: '2', label: t('ps.asr2') }]} onChange={(v) => v && set('asrFactor', v)} />
      <SectionHeader title={t('ps.adjustments')} />
      {KEYS.map((k) => (
        <TextField
          key={k}
          label={k === 'sunrise' ? t('deen.sunrise') : t(`opt.prayer.${k}`)}
          value={form.adj[k]}
          onChange={(v) => setForm((f) => ({ ...f, adj: { ...f.adj, [k]: v } }))}
          error={errors[`adj.${k}`]}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
        />
      ))}
      <Card>
        <Txt variant="label" color="textSecondary">
          {t('ps.preview')} · {fmt.localDate(today)}
        </Txt>
        {KEYS.map((k) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <Txt>{k === 'sunrise' ? t('deen.sunrise') : t(`opt.prayer.${k}`)}</Txt>
            <Txt variant="bodyStrong">{preview.times[k] ? fmt.time(preview.times[k] as string) : '—'}</Txt>
          </Row>
        ))}
        <Txt variant="caption" color="textMuted">
          {CALCULATION_SOURCE}
        </Txt>
      </Card>
      <BooleanField label={t('ps.confirmed')} value={s.confirmed} onChange={(v) => updateSettings({ prayer: { ...s, confirmed: v } })} testID="ps-confirmed" />
      <Button label={t('common.save')} onPress={save} icon="checkmark" testID="ps-save" />
      <Button
        variant="ghost"
        label={t('ps.resetDefaults')}
        onPress={() => {
          updateSettings({ prayer: { ...DEFAULT_PRAYER_SETTINGS, confirmed: false } });
          setForm({
            locationLabel: DEFAULT_PRAYER_SETTINGS.locationLabel,
            latitude: String(DEFAULT_PRAYER_SETTINGS.latitude),
            longitude: String(DEFAULT_PRAYER_SETTINGS.longitude),
            elevationM: '0',
            fajrAngle: '16',
            ishaAngle: '14',
            maghribAngle: '4',
            asrFactor: '1',
            adj: Object.fromEntries(KEYS.map((k) => [k, ''])),
          });
        }}
      />
    </Screen>
  );
}
