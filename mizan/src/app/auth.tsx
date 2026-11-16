import { router } from 'expo-router';
import React, { useState } from 'react';

import { getSupabase } from '@/data/supabase';
import { useApp } from '@/state/AppContext';
import { TextField } from '@/ui/fields';
import { Button, EmptyState, Notice, Screen } from '@/ui/primitives';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const { t, showToast } = useApp();
  const sb = getSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: 'info' | 'danger' } | null>(null);
  if (!sb)
    return (
      <Screen title={t('sync.signIn')} testID="screen-auth">
        <EmptyState icon="cloud-offline-outline" body={t('auth.notConfigured')} />
      </Screen>
    );
  const emailErr = email && !EMAIL_RE.test(email.trim()) ? 'invalid' : undefined;
  const pwErr = password && password.length < 8 ? 'too_small' : undefined;
  const run = async (fn: () => Promise<{ error: unknown }>, ok: string, nav = false) => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await fn();
      if (error) setMsg({ text: t('auth.error'), tone: 'danger' });
      else {
        setMsg({ text: ok, tone: 'info' });
        if (nav) {
          showToast({ message: t('toast.saved') });
          router.back();
        }
      }
    } catch {
      setMsg({ text: t('auth.error'), tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };
  const valid = EMAIL_RE.test(email.trim()) && password.length >= 8;
  return (
    <Screen title={t('sync.signIn')} testID="screen-auth">
      {msg ? <Notice text={msg.text} tone={msg.tone} /> : null}
      <TextField label={t('auth.email')} value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" error={emailErr} />
      <TextField label={t('auth.password')} value={password} onChange={setPassword} secureTextEntry hint={t('auth.passwordRule')} error={pwErr} />
      <Button label={t('sync.signIn')} disabled={!valid} loading={busy} onPress={() => run(() => sb.auth.signInWithPassword({ email: email.trim(), password }), t('toast.saved'), true)} />
      <Button label={t('sync.signUp')} variant="secondary" disabled={!valid} onPress={() => run(() => sb.auth.signUp({ email: email.trim(), password }), t('auth.checkEmail'))} />
      <Button label={t('auth.forgot')} variant="ghost" disabled={!EMAIL_RE.test(email.trim())} onPress={() => run(() => sb.auth.resetPasswordForEmail(email.trim()), t('auth.resetSent'))} />
    </Screen>
  );
}
