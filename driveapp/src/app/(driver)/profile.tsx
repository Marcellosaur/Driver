import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAlertStore } from '@/features/alerts/useAlertStore';
import { fetchDriverProfile } from '@/features/profile/driverProfileApi';
import { useSession } from '@/shared/auth/useSession';
import { DispatchHeader } from '@/shared/ui/dispatch/DispatchHeader';
import { SecondaryDispatchButton } from '@/shared/ui/dispatch/DispatchButtons';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { RouteCodeBadge } from '@/shared/ui/dispatch/StatusBadge';
import { tokens } from '@/shared/ui/design-tokens';

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function ProfileField(props: { label: string; value: string }) {
  return (
    <View className="border-b border-border py-3 last:border-b-0">
      <LabelCaps>{props.label}</LabelCaps>
      <Text className="mt-1 font-sans text-body-md text-foreground" selectable>
        {props.value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const signOut = useSession((s) => s.signOut);
  const sessionStatus = useSession((s) => s.status);
  const userId = useSession((s) => s.userId);
  const tenantId = useSession((s) => s.tenantId);
  const driverId = useSession((s) => s.driverId);
  const role = useSession((s) => s.membershipRole);

  const canQueryDriver = sessionStatus === 'authenticated' && (!!driverId || (!!userId && !!tenantId));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['driver-profile', driverId, userId, tenantId],
    enabled: canQueryDriver,
    queryFn: () => fetchDriverProfile({ driverId, userId, tenantId }),
  });

  const licenseDisplay =
    data?.license_number != null && String(data.license_number).trim() !== ''
      ? data.license_number
      : '—';

  return (
    <View className="flex-1 bg-background">
      <DispatchHeader showMenu />
      <ScrollView contentContainerClassName="px-4 pb-28 pt-2" keyboardShouldPersistTaps="handled">
        <Text className="mb-4 font-sans text-headline-md font-bold text-foreground">Profile</Text>

        {sessionStatus === 'loading' || (canQueryDriver && isLoading) ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={tokens.primary} />
          </View>
        ) : sessionStatus === 'unauthenticated' ? (
          <Text className="font-sans text-body-md text-foreground-secondary">
            Sign in to view your driver profile.
          </Text>
        ) : !canQueryDriver ? (
          <Text className="font-sans text-body-md text-foreground-secondary">
            No driver record is linked to this account yet. Complete onboarding or contact support.
          </Text>
        ) : isError ? (
          <Text className="font-sans text-body-md text-danger">
            {error instanceof Error ? error.message : 'Could not load driver profile.'}
          </Text>
        ) : data ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-display-lg font-bold text-foreground">{data.full_name}</Text>
                <Text className="mt-1 font-sans text-body-md text-foreground-secondary">
                  Operator profile
                </Text>
              </View>
              {driverId ? <RouteCodeBadge code={`DRV-${driverId.slice(0, 6).toUpperCase()}`} /> : null}
            </View>
            <TerminalCard>
              <ProfileField label="Full name" value={data.full_name} />
              <ProfileField label="License number" value={licenseDisplay} />
              <ProfileField label="Status" value={data.status} />
              <ProfileField label="Member since" value={formatCreatedAt(data.created_at)} />
              <ProfileField label="Tenant ID" value={data.tenant_id} />
            </TerminalCard>
          </>
        ) : null}

        <View className="mt-6 gap-2">
          {role ? <Mono className="text-foreground-muted">Role: {role}</Mono> : null}
          <Mono className="text-foreground-muted">
            App v{Constants.expoConfig?.version ?? '1.0.0'}
          </Mono>
          {(userId || driverId) && (
            <Mono className="text-[11px] text-foreground-muted" selectable>
              {userId ? `UID ${userId.slice(0, 8)}…` : ''}
              {userId && driverId ? ' · ' : ''}
              {driverId ? `DRV ${driverId.slice(0, 8)}…` : ''}
            </Mono>
          )}
          <SecondaryDispatchButton
            label="Sign out"
            className="mt-4"
            onPress={() => {
              useAlertStore.getState().reset();
              void signOut();
            }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          />
        </View>
      </ScrollView>
    </View>
  );
}
