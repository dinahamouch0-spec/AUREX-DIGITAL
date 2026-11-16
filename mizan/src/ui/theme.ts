import { useColorScheme } from 'react-native';

import { useApp } from '../state/AppContext';
import { Palette, dark, light } from '../theme/tokens';

export function usePalette(): Palette {
  const { settings } = useApp();
  const system = useColorScheme();
  const mode = settings.theme === 'system' ? (system === 'light' ? 'light' : 'dark') : settings.theme;
  return mode === 'light' ? light : dark;
}

export function useIsDark(): boolean {
  return usePalette() === dark;
}
