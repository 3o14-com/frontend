import { useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StorageService } from '@/services/storage';

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const [accessToken, server] = await Promise.all([
        StorageService.get('accessToken'),
        StorageService.get('server')
      ]);

      const currentSegments = [...segments];

      if (accessToken && server) {
        setIsAuthenticated(true);
        // Only navigate if we're not already on the home page
        if (!currentSegments.some(segment => segment === 'protected')) {
          router.replace('/protected');
        }
      } else {
        setIsAuthenticated(false);
        // Only navigate if we're not already on the index page
        if (currentSegments.length > 0) {
          router.replace('/');
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
      // Only navigate if we're not already on the index page
      if ([...segments].length > 0) {
        router.replace('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments.join('/')]);

  return { isLoading, isAuthenticated, checkAuth };
};
