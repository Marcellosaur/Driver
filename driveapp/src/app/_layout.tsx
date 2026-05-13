import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, type ReactNode } from 'react';
import 'react-native-reanimated';

import { env } from '@/shared/config/env';
import { AppProviders } from '@/shared/providers/AppProviders';
import { startSyncManager } from '@/shared/api/syncManager';
import { useSession } from '@/shared/auth/useSession';
import { buildNavigationTheme } from '@/shared/ui/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    enableAutoSessionTracking: true,
    beforeBreadcrumb: (b) => {
      if (b.category === 'console' && typeof b.message === 'string') {
        if (/Bearer\s+/i.test(b.message)) return null;
      }
      return b;
    },
  });
}

function SessionBootstrap(props: { children: ReactNode }) {
  const hydrate = useSession((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return <>{props.children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationTheme = useMemo(
    () => buildNavigationTheme(colorScheme),
    [colorScheme],
  );

  useEffect(() => {
    startSyncManager();
  }, []);

  const isDark = colorScheme === 'dark';

  return (
    <AppProviders>
      <SessionBootstrap>
        <ThemeProvider value={navigationTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(driver)" />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </SessionBootstrap>
    </AppProviders>
  );
}
