import React from 'react';
import { Stack } from 'expo-router';
import { WebLayout } from '@/components/protected/WebLayout';
import { useTheme } from '@/hooks/useTheme';
import { Platform, useWindowDimensions } from 'react-native';

export default function ModalsLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 768;

  return isWeb && isLargeScreen ? (
    <WebLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          presentation: 'modal',
        }}
      />
    </WebLayout>
  ) : (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        presentation: 'modal',
      }}
    />
  );
}
