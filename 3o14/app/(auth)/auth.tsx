import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';
import * as Linking from 'expo-linking';
import { StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function Auth() {
  const { handleAuthCode } = useAuth();
  const router = useRouter();

  const processAuth = useCallback(async () => {
    try {
      const server = await StorageService.get('server');
      if (!server) {
        setTimeout(() => {
          router.replace('/(auth)');
        }, 0);
        return;
      }

      if (Platform.OS === 'web') {
        const { queryParams } = Linking.parse(window.location.href);
        const authorizationCode = queryParams?.code;

        if (authorizationCode) {
          await handleAuthCode(authorizationCode, server);
          return;
        }

        setTimeout(() => {
          router.replace('/(auth)');
        }, 0);
      } else {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { queryParams } = Linking.parse(initialUrl);
          const authorizationCode = queryParams?.code;
          if (authorizationCode) {
            await handleAuthCode(authorizationCode, server);
            return;
          }
        }

        const subscription = Linking.addEventListener('url', async (event) => {
          const { queryParams } = Linking.parse(event.url);
          const authorizationCode = queryParams?.code;
          if (authorizationCode) {
            await handleAuthCode(authorizationCode, server);
            subscription.remove();
          }
        });

        return () => subscription.remove();
      }
    } catch (err) {
      console.error('Auth error:', err instanceof Error ? err.message : String(err));
      setTimeout(() => {
        router.replace('/(auth)');
      }, 0);
    }
  }, [handleAuthCode, router]);

  useEffect(() => {
    processAuth();
  }, [processAuth]);

  return <Loading />;
}
