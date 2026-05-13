import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getSupabase } from '@/shared/auth/authClient';
import { useSession } from '@/shared/auth/useSession';
import { env } from '@/shared/config/env';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

const MIN_PASSWORD_LENGTH = 8;

type AuthMode = 'signIn' | 'signUp';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.background },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: t.background },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: t.text },
    subtitle: { fontSize: 15, color: t.textSecondary, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      color: t.text,
      backgroundColor: t.inputBackground,
    },
    error: { color: t.danger },
    info: { color: t.textSecondary, fontSize: 15, lineHeight: 22 },
    btn: {
      backgroundColor: t.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { color: t.onPrimary, fontWeight: '700', fontSize: 16 },
    footer: { marginTop: 20, alignItems: 'center', gap: 8 },
    link: { color: t.primary, fontSize: 16, fontWeight: '600' },
    linkMuted: { color: t.textMuted, fontSize: 14 },
  });
}

export default function LoginScreen() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const hydrate = useSession((s) => s.hydrate);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'signIn' ? 'Sign in' : 'Create account',
    });
  }, [mode, navigation]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next === 'signIn') {
      setConfirmPassword('');
    }
  }

  async function onSignIn() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = getSupabase();
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
          ? {
              options: {
                data: { tenant_id: env.signupTenantId },
              },
            }
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
      setError(null);
      setInfo(
        'Check your email to confirm your account, then sign in. With EXPO_PUBLIC_SIGNUP_TENANT_ID set and Supabase migrations applied, a driver profile is created automatically (database trigger + optional RPC on first session).',
      );
    } finally {
      setBusy(false);
    }
  }

  const primaryLabel = mode === 'signIn' ? 'Sign in' : 'Create account';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>TeroBytez Driver</Text>
        <Text style={styles.subtitle}>
          {mode === 'signIn' ? 'Sign in with your work email.' : 'Create your account with email and password.'}
        </Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="Email"
          placeholderTextColor={t.placeholder}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={t.placeholder}
          secureTextEntry
          autoComplete={mode === 'signIn' ? 'password' : 'password-new'}
          textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
          value={password}
          onChangeText={setPassword}
        />
        {mode === 'signUp' ? (
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={t.placeholder}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Pressable
          style={styles.btn}
          onPress={() => void (mode === 'signIn' ? onSignIn() : onSignUp())}
          disabled={busy}>
          {busy ? <ActivityIndicator color={t.onPrimary} /> : <Text style={styles.btnText}>{primaryLabel}</Text>}
        </Pressable>
        <View style={styles.footer}>
          {mode === 'signIn' ? (
            <>
              <Text style={styles.linkMuted}>New driver?</Text>
              <Pressable onPress={() => switchMode('signUp')} disabled={busy}>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => switchMode('signIn')} disabled={busy}>
              <Text style={styles.link}>Already have an account? Sign in</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
