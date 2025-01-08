import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { StorageService } from '@/services/storage';
import { Loading } from '@/components/common/Loading';
import { useTheme } from '@/hooks/useTheme';
import { WebLayout } from '@/components/protected/WebLayout';
import { usePathname } from 'expo-router';

export default function RootLayout() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const pathname = usePathname();

  const isScreenRoute = pathname.startsWith('/screens/');
  const showWebLayout = isWeb && width > 768 && isScreenRoute;

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

  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };

  return (
    <>
      {showWebLayout ? (
        <WebLayout>
          <Stack screenOptions={screenOptions} />
        </WebLayout>
      ) : (
        <Stack screenOptions={screenOptions} />
      )}
    </>
  );
}
