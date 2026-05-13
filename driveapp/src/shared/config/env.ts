import Constants from 'expo-constants';

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL ?? '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  googleMapsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAP_API_KEY,
  appVersion: Constants.expoConfig?.version ?? 'unknown',
  /** When set, new sign-ups call RPC `register_self_as_driver` for this tenant (requires DB migration). */
  signupTenantId: process.env.EXPO_PUBLIC_SIGNUP_TENANT_ID?.trim() ?? '',
};
