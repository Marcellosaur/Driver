import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

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
  background: '#121212',
  surface: '#1e1e1e',
  surfaceElevated: '#2a2a2a',
  text: '#eceff1',
  textSecondary: '#b0bec5',
  textMuted: '#78909c',
  border: '#3d4446',
  inputBackground: '#1e1e1e',
  inputBorder: '#3d4446',
  placeholder: '#78909c',
  primary: '#64b5f6',
  onPrimary: '#0d1927',
  danger: '#ef5350',
  onDanger: '#1a0000',
  successBannerBg: '#1b3a1e',
  successBannerText: '#a5d6a7',
  seqBadgeBg: '#37474f',
  seqBadgeText: '#eceff1',
  tabBar: '#1e1e1e',
  tabBarBorder: '#2a2a2a',
  overlay: 'rgba(0,0,0,0.65)',
  modalSurface: '#2a2a2a',
  modalText: '#eceff1',
  modalTextSecondary: '#b0bec5',
  modalBorder: '#3d4446',
  link: '#90caf9',
  mapPolyline: '#64b5f6',
  mapFallbackBg: '#0d1b2a',
  shadow: '#000000',
  secondaryButtonBg: '#424242',
  secondaryButtonText: '#eceff1',
};

export function getPalette(scheme: 'light' | 'dark' | null | undefined): AppPalette {
  const s = scheme === 'dark' ? 'dark' : 'light';
  return { scheme: s, ...(s === 'dark' ? dark : light) };
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