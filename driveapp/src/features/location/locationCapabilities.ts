import { Platform } from 'react-native';

/** Background location + TaskManager require iOS/Android native modules. */
export function supportsBackgroundLocation(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** Foreground GPS for trip tracking (still mobile-first; web is optional). */
export function supportsForegroundLocation(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
