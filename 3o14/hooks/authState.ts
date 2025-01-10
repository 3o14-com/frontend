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
    // Prevent multiple simultaneous checks
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;

    try {
      setIsLoading(true);
      const [accessToken, server] = await Promise.all([
        StorageService.get('accessToken'),
        StorageService.get('server')
      ]);

      const currentSegments = [...segments];

      if (accessToken && server) {
        setIsAuthenticated(true);
        // Add a small delay before navigation
        if (!currentSegments.some(segment => segment === 'protected')) {
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace('/protected');
        }
      } else {
        setIsAuthenticated(false);
        if (currentSegments.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Auth check error:',
        error instanceof Error ? error.message : String(error)
      );
      setIsAuthenticated(false);
      if ([...segments].length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/');
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
