import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StorageService } from '@/services/storage';
import { Loading } from '@/components/common/Loading';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const [] = await Promise.all([
          StorageService.get('accessToken'),
          StorageService.get('server')
        ]);
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Initial auth check error:',
          error instanceof Error ? error.message : String(error)
        );
        setInitialLoadComplete(true);
      }
    };
    checkInitialAuth();
  }, []);

  if (!initialLoadComplete) {
    return <Loading />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="protected" />
      <Stack.Screen
        name="screens"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
