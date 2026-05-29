import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { tokens } from '@/shared/ui/design-tokens';

export type AppColorScheme = 'light' | 'dark';

export interface AppPalette {
  scheme: AppColorScheme;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  primary: string;
  onPrimary: string;
  danger: string;
  onDanger: string;
  successBannerBg: string;
  successBannerText: string;
  seqBadgeBg: string;
  seqBadgeText: string;
  tabBar: string;
  tabBarBorder: string;
  overlay: string;
  modalSurface: string;
  modalText: string;
  modalTextSecondary: string;
  modalBorder: string;
  link: string;
  mapPolyline: string;
  mapFallbackBg: string;
  shadow: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
}

const light: Omit<AppPalette, 'scheme'> = {
  background: '#ffffff',
  surface: '#f4f6f8',
  surfaceElevated: '#ffffff',
  text: '#11181C',
  textSecondary: '#42474e',
  textMuted: '#687076',
  border: '#d1d5db',
  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',
  placeholder: '#687076',
  primary: '#1565c0',
  onPrimary: '#ffffff',
  danger: '#c62828',
  onDanger: '#ffffff',
  successBannerBg: '#c8e6c9',
  successBannerText: '#1b5e20',
  seqBadgeBg: '#e8eaed',
  seqBadgeText: '#11181C',
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  overlay: 'rgba(0,0,0,0.45)',
  modalSurface: '#ffffff',
  modalText: '#11181C',
  modalTextSecondary: '#42474e',
  modalBorder: '#d1d5db',
  link: '#1565c0',
  mapPolyline: '#1565c0',
  mapFallbackBg: '#e3f2fd',
  shadow: '#000000',
  secondaryButtonBg: '#2c2c2c',
  secondaryButtonText: '#ffffff',
};

const dark: Omit<AppPalette, 'scheme'> = {
  background: tokens.background,
  surface: tokens.surfaceContainer,
  surfaceElevated: tokens.surfaceContainerHigh,
  text: tokens.onSurface,
  textSecondary: tokens.onSurfaceVariant,
  textMuted: tokens.outline,
  border: tokens.outline,
  inputBackground: tokens.surfaceContainerLow,
  inputBorder: '#3b4a46',
  placeholder: tokens.outline,
  primary: tokens.primary,
  onPrimary: tokens.onPrimary,
  danger: tokens.emergency,
  onDanger: tokens.onEmergency,
  successBannerBg: tokens.statusActive,
  successBannerText: '#ffffff',
  seqBadgeBg: tokens.surfaceContainerHigh,
  seqBadgeText: tokens.primary,
  tabBar: tokens.tabBar,
  tabBarBorder: tokens.tabBarBorder,
  overlay: 'rgba(0,0,0,0.65)',
  modalSurface: tokens.surfaceContainer,
  modalText: tokens.onSurface,
  modalTextSecondary: tokens.onSurfaceVariant,
  modalBorder: tokens.primary,
  link: tokens.primary,
  mapPolyline: tokens.mapPolyline,
  mapFallbackBg: tokens.mapFallback,
  shadow: '#000000',
  secondaryButtonBg: tokens.surfaceContainer,
  secondaryButtonText: tokens.onSurface,
};

export function getPalette(_scheme: 'light' | 'dark' | null | undefined): AppPalette {
  return { scheme: 'dark', ...dark };
}

export function buildNavigationTheme(scheme: 'light' | 'dark' | null | undefined): Theme {
  const p = getPalette(scheme);
  const base = p.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: p.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: p.primary,
      background: p.background,
      card: p.surfaceElevated,
      text: p.text,
      border: p.border,
      notification: p.danger,
    },
  };
}