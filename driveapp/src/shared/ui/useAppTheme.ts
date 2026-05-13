import { useColorScheme } from 'react-native';

import { getPalette, type AppPalette } from '@/shared/ui/theme';

export function useAppPalette(): AppPalette {
  const scheme = useColorScheme();
  return getPalette(scheme);
}
