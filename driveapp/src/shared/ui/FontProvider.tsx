import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts as useHanken,
} from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_500Medium, useFonts as useJetBrains } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function FontProvider(props: { children: ReactNode }) {
  const [hankenLoaded] = useHanken({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });
  const [monoLoaded] = useJetBrains({ JetBrainsMono_500Medium });
  const ready = hankenLoaded && monoLoaded;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return <>{props.children}</>;
}
