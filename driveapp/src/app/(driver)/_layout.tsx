import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAlertStore } from '@/features/alerts/useAlertStore';
import { TripProvider } from '@/features/trips/tripContext';
import { TripRuntime } from '@/features/trips/TripRuntime';
import { registerDevice } from '@/shared/auth/registerDevice';
import { useSession } from '@/shared/auth/useSession';
import { getExpoPushTokenIfAvailable } from '@/shared/push/expoNotificationsSafe';
import { tokens } from '@/shared/ui/design-tokens';
import { Body, SecondaryButton, SecondaryButtonText, Title } from '@/shared/ui/primitives';
import { useAppPalette } from '@/shared/ui/useAppTheme';

const WRITE_CAPABLE = new Set(['dispatcher', 'company_admin']);

function SignOutFooter(props: { onSignOut: () => void | Promise<void> }) {
  return (
    <SecondaryButton onPress={() => void props.onSignOut()} accessibilityRole="button" accessibilityLabel="Sign out">
      <SecondaryButtonText>Sign out</SecondaryButtonText>
    </SecondaryButton>
  );
}

function AccessDenied(props: { onSignOut: () => void | Promise<void> }) {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Title className="mb-2 text-xl">Access Denied</Title>
      <Body className="text-center">
        Your account needs dispatcher or company_admin membership to use the driver app and post
        locations (RLS).
      </Body>
      <SignOutFooter onSignOut={props.onSignOut} />
    </View>
  );
}

export default function DriverLayout() {
  const t = useAppPalette();
  const alertStatus = useAlertStore((s) => s.status);

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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!driverId || !tenantId || !membershipRole) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Title className="mb-2 text-xl">Driver profile missing</Title>
        <Body className="text-center">No drivers row or tenant could be resolved for this user.</Body>
        <SignOutFooter onSignOut={signOut} />
      </View>
    );
  }

  if (!WRITE_CAPABLE.has(membershipRole)) {
    return <AccessDenied onSignOut={signOut} />;
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
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
            tabBarBadge: alertStatus === 'failed' || alertStatus === 'pending' ? '' : undefined,
            tabBarBadgeStyle: { backgroundColor: tokens.emergency, minWidth: 8, maxHeight: 8 },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" color={color} size={size} />
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
