import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_THEME, DARK_THEME } from '@/constants/theme';
import type { Theme } from '@/types/theme';
import * as SystemUI from 'expo-system-ui';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME);
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [colorScheme]);

  return theme;
};
