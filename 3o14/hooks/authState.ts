import { useState, useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StorageService } from '@/services/storage';

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const isCheckingAuth = useRef(false);

  const checkAuth = async () => {
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;

    try {
      setIsLoading(true);
      const [accessToken, server] = await Promise.all([
        StorageService.get('accessToken'),
        StorageService.get('server')
      ]);

      const inAuthGroup = segments[0] === '(auth)';
      const inProtectedGroup = segments[0] === '(tabs)' || segments[0] === '(modals)';

      if (accessToken && server) {
        setIsAuthenticated(true);
        if (inAuthGroup) {
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace('/(tabs)');
        }
      } else {
        setIsAuthenticated(false);
        if (inProtectedGroup) {
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace('/(auth)/auth');
        }
      }
    } catch (error) {
      console.error('Auth check error:',
        error instanceof Error ? error.message : String(error)
      );
      setIsAuthenticated(false);
      if (segments.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/(auth)/auth');
      }
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const runAuthCheck = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    runAuthCheck();
    return () => {
      mounted = false;
    };
  }, [segments.join('/')]);

  return { isLoading, isAuthenticated, checkAuth };
};
