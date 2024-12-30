import React from 'react';
import { Stack } from 'expo-router';
import { useAuthState } from '@/hooks/authState';
import { Loading } from '@/components/common/Loading';

export default function RootLayout() {
  const { isLoading } = useAuthState();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="auth/home" options={{ headerShown: false }} />
    </Stack>
  );
}
