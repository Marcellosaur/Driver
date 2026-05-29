import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

/** TeroBytez is dark-mode-first; always apply dispatch terminal theme. */
export function NativeWindColorSchemeSync() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  return null;
}
