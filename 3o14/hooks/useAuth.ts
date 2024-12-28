import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/auth';
import { StorageService } from '@/services/storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AUTH_CONFIG } from '@/constants/auth';
import { API_ENDPOINTS } from '@/constants/api';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = useCallback(async (server: string) => {
    setIsLoading(true);
    try {
      await StorageService.set('server', server);

      const appData = await AuthService.registerApp(server);
      if (!appData.client_id || !appData.client_secret) {
        throw new Error('Failed to register app.');
      }

      await StorageService.set('clientId', appData.client_id);
      await StorageService.set('clientSecret', appData.client_secret);

      const authUrl = `https://${server}${API_ENDPOINTS.AUTHORIZE}?` +
        `client_id=${appData.client_id}&` +
        `redirect_uri=${encodeURIComponent(Linking.createURL(AUTH_CONFIG.REDIRECT_URI))}&` +
        `response_type=code&` +
        `scope=${AUTH_CONFIG.SCOPES}`;

      if (Platform.OS === 'web') {
        await Linking.openURL(authUrl);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          Linking.createURL(AUTH_CONFIG.REDIRECT_URI)
        );

        if (result.type === 'success' && result.url) {
          const { queryParams } = Linking.parse(result.url);
          await handleAuthCode(queryParams?.code, server);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthCode = async (code: string | string[] | undefined, server: string) => {
    if (!code) throw new Error('Authorization failed.');

    const clientId = await StorageService.get('clientId');
    const clientSecret = await StorageService.get('clientSecret');

    if (!clientId || !clientSecret) {
      throw new Error('App credentials not found.');
    }

    const tokenData = await AuthService.getAccessToken(server, {
      client_id: clientId,
      client_secret: clientSecret,
      code: Array.isArray(code) ? code[0] : code,
    });

    if (!tokenData.access_token) {
      throw new Error('Failed to retrieve access token.');
    }

    await StorageService.set('accessToken', tokenData.access_token);
    router.push('/auth/home');
  };

  const logout = useCallback(async () => {
    await StorageService.clear();
    router.push('/');
  }, []);

  return { login, logout, isLoading, handleAuthCode };
};
