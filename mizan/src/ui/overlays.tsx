import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeSearch } from '../domain/exerciseCatalog';
import { useApp } from '../state/AppContext';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { Button, Icon, Row, Txt } from './primitives';
import { usePalette } from './theme';

export function ConfirmHost() {
  const { confirmSpec } = useApp();
  if (!confirmSpec) return null;
  return <ConfirmDialog key={`${confirmSpec.title}:${confirmSpec.body ?? ''}`} />;
}

function ConfirmDialog() {
  const { confirmSpec, resolveConfirm, t } = useApp();
  const p = usePalette();
  const [typed, setTyped] = useState('');
  if (!confirmSpec) return null;
  const blocked = !!confirmSpec.requireText && typed !== confirmSpec.requireText;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => resolveConfirm(false)}>
      <View style={{ flex: 1, backgroundColor: p.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          testID="confirm-dialog"
          style={{ width: '100%', maxWidth: 420, backgroundColor: p.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: p.border }}>
          <Txt variant="heading">{confirmSpec.title}</Txt>
          {confirmSpec.body ? <Txt color="textSecondary">{confirmSpec.body}</Txt> : null}
          {confirmSpec.requireText ? (
            <TextInput
              testID="confirm-input"
              value={typed}
              onChangeText={setTyped}
              placeholder={confirmSpec.requireText}
              placeholderTextColor={p.textMuted}
              autoCapitalize="characters"
              accessibilityLabel={t('data.typeToConfirm')}
              style={[type.body, { color: p.text, borderWidth: 1, borderColor: p.border, borderRadius: radius.sm, padding: spacing.md, minHeight: MIN_TOUCH }]}
            />
          ) : null}
          <Row style={{ justifyContent: 'flex-end' }}>
            <Button label={t('common.cancel')} variant="secondary" onPress={() => resolveConfirm(false)} testID="confirm-cancel" />
            <Button
              label={confirmSpec.confirmLabel ?? t('common.confirm')}
              variant={confirmSpec.destructive ? 'danger' : 'primary'}
              onPress={() => resolveConfirm(true)}
              disabled={blocked}
              testID="confirm-ok"
            />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

export function ToastHost() {
  const { toast, hideToast } = useApp();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', start: 0, end: 0, bottom: insets.bottom + 84, alignItems: 'center', paddingHorizontal: spacing.lg }}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        testID="toast"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: p.surfaceElevated,
          borderColor: toast.tone === 'error' ? p.danger : p.border,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          maxWidth: 520,
        }}>
        <Txt style={{ flexShrink: 1 }}>{toast.message}</Txt>
        {toast.actionLabel && toast.onAction ? (
          <Pressable
            testID="toast-action"
            accessibilityRole="button"
            onPress={() => {
              toast.onAction?.();
              hideToast();
            }}
            style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <Txt color="accent" variant="bodyStrong">
              {toast.actionLabel}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export interface SheetOption {
  value: string;
  label: string;
  subtitle?: string;
}

export function SelectSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  allowClear,
}: {
  visible: boolean;
  title: string;
  options: SheetOption[];
  value: string | null;
  onSelect: (v: string | null) => void;
  onClose: () => void;
  allowClear?: boolean;
}) {
  const p = usePalette();
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    // reset the search box whenever the sheet opens (derived-state pattern, no effect)
    setWasVisible(visible);
    if (visible) setQ('');
  }
  const nq = normalizeSearch(q);
  const filtered = nq ? options.filter((o) => normalizeSearch(`${o.label} ${o.subtitle ?? ''}`).includes(nq)) : options;
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: p.overlay }} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View
        accessibilityViewIsModal
        testID="select-sheet"
        style={{ maxHeight: '75%', backgroundColor: p.surfaceElevated, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insets.bottom + spacing.md }}>
        <Row style={{ padding: spacing.lg, justifyContent: 'space-between' }}>
          <Txt variant="heading" style={{ flex: 1 }}>
            {title}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" />
          </Pressable>
        </Row>
        {options.length > 8 ? (
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('common.search')}
            placeholderTextColor={p.textMuted}
            accessibilityLabel={t('common.search')}
            style={[type.body, { color: p.text, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: p.border, borderRadius: radius.sm, padding: spacing.md }]}
          />
        ) : null}
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
          {allowClear ? (
            <SheetRow label={t('common.none')} selected={value == null} onPress={() => onSelect(null)} testID="select-option-none" />
          ) : null}
          {filtered.map((o) => (
            <SheetRow key={o.value} label={o.label} subtitle={o.subtitle} selected={o.value === value} onPress={() => onSelect(o.value)} testID={`select-option-${o.value}`} />
          ))}
          {filtered.length === 0 ? (
            <Txt color="textMuted" align="center" style={{ padding: spacing.lg }}>
              {t('state.noResults')}
            </Txt>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SheetRow({ label, subtitle, selected, onPress, testID }: { label: string; subtitle?: string; selected: boolean; onPress: () => void; testID?: string }) {
  const p = usePalette();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH + 4, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: pressed || selected ? p.accentMuted : 'transparent' })}>
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        {subtitle ? (
          <Txt variant="caption" color="textSecondary">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {selected ? <Icon name="checkmark" color="accent" /> : null}
    </Pressable>
  );
}
