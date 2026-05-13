import { getSupabase } from '@/shared/auth/authClient';
import { env } from '@/shared/config/env';

export type ProvisionResult =
  | { ok: true }
  | { ok: false; code: 'not_configured'; message: string }
  | { ok: false; code: 'rpc_error'; message: string };

/**
 * Fallback: creates `drivers` + `memberships` via RPC when trigger did not run or failed.
 * Requires migrations `register_self_as_driver` + `auth_trigger_provision_driver`.
 * Primary path: `auth.users` trigger + `signUp({ options: { data: { tenant_id }}}` when env is set.
 */
export async function registerSelfAsDriverAfterSignup(): Promise<ProvisionResult> {
  const tenantId = env.signupTenantId;
  if (!tenantId) {
    return {
      ok: false,
      code: 'not_configured',
      message:
        'Self-serve driver signup is not configured. Set EXPO_PUBLIC_SIGNUP_TENANT_ID and apply the register_self_as_driver migration, or ask an admin to add your driver profile.',
    };
  }

  const supabase = getSupabase();
  const { error } = await supabase.rpc('register_self_as_driver', { p_tenant_id: tenantId });

  if (error) {
    return {
      ok: false,
      code: 'rpc_error',
      message: error.message.includes('Could not find')
        ? 'Database function register_self_as_driver is missing. Apply supabase/migrations/20260512000000_register_self_as_driver.sql in your project.'
        : error.message,
    };
  }

  return { ok: true };
}
