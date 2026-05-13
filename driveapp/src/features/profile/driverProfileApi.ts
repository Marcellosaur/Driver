import { getSupabase } from '@/shared/auth/authClient';
import type { Driver } from '@/types/db';

export type DriverProfileRow = Pick<
  Driver,
  'full_name' | 'license_number' | 'status' | 'created_at' | 'tenant_id'
>;

export async function fetchDriverProfile(params: {
  driverId: string | null;
  userId: string | null;
  tenantId: string | null;
}): Promise<DriverProfileRow> {
  const supabase = getSupabase();
  const sel = 'full_name, license_number, status, created_at, tenant_id';

  if (params.driverId) {
    const { data, error } = await supabase.from('drivers').select(sel).eq('id', params.driverId).single();
    if (error) throw error;
    return data as DriverProfileRow;
  }

  if (params.userId && params.tenantId) {
    const { data, error } = await supabase
      .from('drivers')
      .select(sel)
      .eq('user_id', params.userId)
      .eq('tenant_id', params.tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Driver profile not found');
    return data as DriverProfileRow;
  }

  throw new Error('Missing driver profile identifiers');
}
