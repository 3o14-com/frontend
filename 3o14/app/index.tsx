import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StorageService } from '@/services/storage';
import { Loading } from '@/components/common/Loading';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        const [accessToken, server] = await Promise.all([
          StorageService.get('accessToken'),
          StorageService.get('server')
        ]);

        if (accessToken && server) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)');
        }
      } catch (error) {
        console.error('Initial route check error:', error);
        router.replace('/(auth)');
      }
    };

    checkInitialRoute();
  }, []);

  return <Loading />;
}
