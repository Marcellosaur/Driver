import { useQuery } from '@tanstack/react-query';

import type { Entitlement } from '@/types/db';

import { getSupabase } from '@/shared/auth/authClient';

export function useEntitlementsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: ['entitlements', tenantId],
    enabled: !!tenantId,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Entitlement[]> => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('entitlements')
        .select('tenant_id, feature_key, enabled')
        .eq('tenant_id', tenantId!);
      if (error) throw error;
      return (data ?? []) as Entitlement[];
    },
  });
}

/** Default flush interval; when `gps_cadence_seconds` is enabled, tenant-specific tuning can extend this helper. */
export function getGpsCadenceSeconds(entitlements: Entitlement[] | undefined): number {
  const row = entitlements?.find((e) => e.feature_key === 'gps_cadence_seconds');
  if (!row?.enabled) return 5;
  return 5;
}
