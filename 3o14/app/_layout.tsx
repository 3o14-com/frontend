import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StorageService } from '@/services/storage';
import { Loading } from '@/components/common/Loading';

export default function RootLayout() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Perform initial auth check without navigation
    const checkInitialAuth = async () => {
      try {
        const [] = await Promise.all([
          StorageService.get('accessToken'),
          StorageService.get('server')
        ]);

        // Set initial state complete regardless of auth status
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="protected/index"
        options={{
          // Add any protected route specific options here
        }}
      />
    </Stack>
  );
}
