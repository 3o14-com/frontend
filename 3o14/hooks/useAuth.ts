import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/auth';
import { StorageService } from '@/services/storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AUTH_CONFIG } from '@/constants/auth';
import { API_ENDPOINTS } from '@/constants/api';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  header: string;
  bio: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Add function to fetch user details
  const fetchUserDetails = async (server: string, accessToken: string) => {
    const response = await fetch(`https://${server}/api/v1/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user details.');
    }
    return await response.json();
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const [server, accessToken] = await Promise.all([
          StorageService.get('server'),
          StorageService.get('accessToken'),
        ]);

        if (server && accessToken) {
          const userData = await fetchUserDetails(server, accessToken);
          setUser(userData);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    checkSession();
  }, []);

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
      console.log('Failed to retrieve access token.');
    }

    await StorageService.set('accessToken', tokenData.access_token);

    // Fetch and store user details
    const userData = await fetchUserDetails(server, tokenData.access_token);
    setUser(userData);
    await StorageService.set('userID', userData.id);

    router.push('/protected');
  };

  const logout = useCallback(async () => {
    setUser(null);
    await StorageService.clear();
    router.push('/');
  }, []);

  return { login, logout, isLoading, handleAuthCode, user };
};
