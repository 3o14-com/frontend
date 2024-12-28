import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';
import * as Linking from 'expo-linking';
import { StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';

export default function Auth() {
  const { handleAuthCode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const server = await StorageService.get('server');
        if (!server) throw new Error('Server URL not found.');

        const initialUrl = await Linking.getInitialURL();
        if (!initialUrl) throw new Error('No URL found.');

        const { queryParams } = Linking.parse(window.location.href);
        const authorizationCode = queryParams?.code;

        await handleAuthCode(authorizationCode, server);
      } catch (error) {
        console.error('Auth error:', error);
        router.replace('/');
      }
    };

    processAuth();
  }, []);

  return <Loading />;
}
