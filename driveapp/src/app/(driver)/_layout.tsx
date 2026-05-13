import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { registerDevice } from '@/shared/auth/registerDevice';
import { useSession } from '@/shared/auth/useSession';
import { getExpoPushTokenIfAvailable } from '@/shared/push/expoNotificationsSafe';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';
import { TripProvider } from '@/features/trips/tripContext';
import { TripRuntime } from '@/features/trips/TripRuntime';

const WRITE_CAPABLE = new Set(['dispatcher', 'company_admin']);

function makeLayoutStyles(t: AppPalette) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: t.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
      color: t.text,
    },
    body: {
      fontSize: 16,
      textAlign: 'center',
      color: t.textSecondary,
    },
    logoutBtn: {
      marginTop: 24,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 8,
      backgroundColor: t.secondaryButtonBg,
      alignItems: 'center',
    },
    logoutBtnText: {
      color: t.secondaryButtonText,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}

function SignOutFooter(props: {
  styles: ReturnType<typeof makeLayoutStyles>;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <Pressable
      style={props.styles.logoutBtn}
      onPress={() => void props.onSignOut()}
      accessibilityRole="button"
      accessibilityLabel="Sign out">
      <Text style={props.styles.logoutBtnText}>Sign out</Text>
    </Pressable>
  );
}

function AccessDenied(props: {
  styles: ReturnType<typeof makeLayoutStyles>;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <View style={props.styles.centered}>
      <Text style={props.styles.title}>Access Denied</Text>
      <Text style={props.styles.body}>
        Your account needs dispatcher or company_admin membership to use the driver app and post
        locations (RLS).
      </Text>
      <SignOutFooter styles={props.styles} onSignOut={props.onSignOut} />
    </View>
  );
}

export default function DriverLayout() {
  const t = useAppPalette();
  const styles = useMemo(() => makeLayoutStyles(t), [t]);

  const status = useSession((s) => s.status);
  const userId = useSession((s) => s.userId);
  const tenantId = useSession((s) => s.tenantId);
  const driverId = useSession((s) => s.driverId);
  const membershipRole = useSession((s) => s.membershipRole);
  const signOut = useSession((s) => s.signOut);

  useEffect(() => {
    if (status !== 'authenticated' || !userId || !tenantId || !driverId || !membershipRole) {
      return;
    }
    if (!WRITE_CAPABLE.has(membershipRole)) {
      return;
    }

    let cancelled = false;
    (async () => {
      const token = await getExpoPushTokenIfAvailable();
      if (cancelled) return;
      await registerDevice({
        userId,
        tenantId,
        pushToken: token,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId, tenantId, driverId, membershipRole]);

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!driverId || !tenantId || !membershipRole) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Driver profile missing</Text>
        <Text style={styles.body}>No drivers row or tenant could be resolved for this user.</Text>
        <SignOutFooter styles={styles} onSignOut={signOut} />
      </View>
    );
  }

  if (!WRITE_CAPABLE.has(membershipRole)) {
    return <AccessDenied styles={styles} onSignOut={signOut} />;
  }

  return (
    <TripProvider tenantId={tenantId} driverId={driverId} key={`${tenantId}-${driverId}`}>
      <TripRuntime />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: t.tabBar,
            borderTopColor: t.tabBarBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
          tabBarActiveTintColor: t.primary,
          tabBarInactiveTintColor: t.textMuted,
        }}>
        <Tabs.Screen
          name="trip"
          options={{
            title: 'Trip',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </TripProvider>
  );
}
