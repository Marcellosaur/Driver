import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { getSupabase } from '@/shared/auth/authClient';
import { useSession } from '@/shared/auth/useSession';
import { env } from '@/shared/config/env';
import { PrimaryDispatchButton } from '@/shared/ui/dispatch/DispatchButtons';
import { SecureConnectionBadge, TerminalInput } from '@/shared/ui/dispatch/TerminalInput';
import { LabelCaps } from '@/shared/ui/dispatch/Typography';
const MIN_PASSWORD_LENGTH = 8;

type AuthMode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const hydrate = useSession((s) => s.hydrate);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next === 'signIn') setConfirmPassword('');
  }

  async function onSignIn() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = getSupabase();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      await hydrate();
      router.replace('/(driver)/trip');
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    setError(null);
    setInfo(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        ...(env.signupTenantId
          ? { options: { data: { tenant_id: env.signupTenantId } } }
          : {}),
      });
      if (signUpErr) {
        setError(signUpErr.message);
        return;
      }
      if (data.session) {
        await hydrate();
        router.replace('/(driver)/trip');
        return;
      }
      setMode('signIn');
      setConfirmPassword('');
      setInfo(
        'Check your email to confirm your account, then sign in. With EXPO_PUBLIC_SIGNUP_TENANT_ID set, a driver profile is created automatically.',
      );
    } finally {
      setBusy(false);
    }
  }

  const primaryLabel = mode === 'signIn' ? 'Sign in' : 'Create account';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-4 py-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-8 items-center">
          <Text className="font-sans text-display-lg font-bold text-foreground">TeroBytez</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-primary" />
            <LabelCaps className="text-primary">Dispatch terminal</LabelCaps>
          </View>
        </View>

        <View className="rounded-card border border-border bg-surface p-5">
          <TerminalInput
            label="Operator ID"
            icon="person-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="email@company.com"
            value={email}
            onChangeText={setEmail}
          />
          <View className="mt-4">
            <TerminalInput
              label="Access key"
              icon="lock-closed-outline"
              trailingIcon="eye-off-outline"
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
          </View>
          {mode === 'signUp' ? (
            <View className="mt-4">
              <TerminalInput
                label="Confirm access key"
                icon="lock-closed-outline"
                secureTextEntry
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          ) : null}
          {error ? <Text className="mt-3 font-sans text-sm text-danger">{error}</Text> : null}
          {info ? <Text className="mt-3 font-sans text-sm text-foreground-secondary">{info}</Text> : null}
          <View className="mt-5">
            <PrimaryDispatchButton
              label={primaryLabel}
              icon="log-in-outline"
              loading={busy}
              onPress={() => void (mode === 'signIn' ? onSignIn() : onSignUp())}
            />
          </View>
          {mode === 'signIn' ? (
            <Pressable className="mt-4 items-center" onPress={() => switchMode('signUp')} disabled={busy}>
              <Text className="font-mono text-technical text-foreground-muted">Request key reset</Text>
            </Pressable>
          ) : (
            <Pressable className="mt-4 items-center" onPress={() => switchMode('signIn')} disabled={busy}>
              <Text className="font-sans text-sm font-semibold text-primary">Already registered? Sign in</Text>
            </Pressable>
          )}
        </View>

        <SecureConnectionBadge />
        <Text className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-foreground-muted">
          Powered by TeroBytez
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
