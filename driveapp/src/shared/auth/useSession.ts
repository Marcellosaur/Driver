import { create } from 'zustand';

import type { MembershipRole } from '@/types/db';

import { getSupabase } from '@/shared/auth/authClient';
import { clearDevicePushToken } from '@/shared/auth/registerDevice';
import { registerSelfAsDriverAfterSignup } from '@/shared/auth/signupProvision';
import { clearTokens, saveTokens } from '@/shared/auth/tokenStorage';
import { env } from '@/shared/config/env';

export interface SessionSlice {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  userId: string | null;
  tenantId: string | null;
  driverId: string | null;
  membershipRole: MembershipRole | null;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionSlice>((set, get) => ({
  status: 'loading',
  userId: null,
  tenantId: null,
  driverId: null,
  membershipRole: null,

  hydrate: async () => {
    set({ status: 'loading' });
    const supabase = getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await clearTokens();
      set({
        status: 'unauthenticated',
        userId: null,
        tenantId: null,
        driverId: null,
        membershipRole: null,
      });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token && sessionData.session.refresh_token) {
      await saveTokens({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      });
    }

    let { data: driverRow, error: driverError } = await supabase
      .from('drivers')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!driverRow && !driverError && env.signupTenantId) {
      const provision = await registerSelfAsDriverAfterSignup();
      if (provision.ok) {
        const retry = await supabase
          .from('drivers')
          .select('id, tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        driverRow = retry.data;
        driverError = retry.error;
      }
    }

    if (driverError || !driverRow) {
      set({
        status: 'authenticated',
        userId: user.id,
        tenantId: null,
        driverId: null,
        membershipRole: null,
      });
      return;
    }

    const tenantId = driverRow.tenant_id as string;

    const { data: membership } = await supabase
      .from('memberships')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    set({
      status: 'authenticated',
      userId: user.id,
      tenantId,
      driverId: driverRow.id as string,
      membershipRole: (membership?.role as MembershipRole) ?? null,
    });
  },

  signOut: async () => {
    const supabase = getSupabase();
    const uid = get().userId;
    if (uid) {
      await clearDevicePushToken(uid);
    }
    await supabase.auth.signOut();
    await clearTokens();
    set({
      status: 'unauthenticated',
      userId: null,
      tenantId: null,
      driverId: null,
      membershipRole: null,
    });
  },
}));
