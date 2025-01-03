import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, StatusBar, Alert, RefreshControl } from 'react-native';
import { PostCard } from '@/components/protected/PostCard';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Post } from '@/types/api';

type TimelineType = 'home' | 'local';

interface TimelineProps {
  type: TimelineType;
}

export function Timeline({ type }: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { logout } = useAuth();
  const theme = useTheme();

  const fetchTimeline = async (refresh = false) => {
    try {
      const server = await StorageService.get('server');
      if (!server) {
        Alert.alert('Error', 'Server configuration not found. Please login again.');
        logout();
        return;
      }

      const fetchFunction = type === 'home'
        ? ApiService.getHomeTimeline
        : ApiService.getLocalTimeline;

      const data = await fetchFunction(server, refresh ? undefined : (maxId ?? undefined));

      if (data.length > 0) {
        setPosts(prevPosts => refresh ? data : [...prevPosts, ...data]);
        setMaxId(data[data.length - 1].id);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      // Determine if the error is authentication-related
      const errorMessage = error instanceof Error ? error.message : '';
      const isAuthError = errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403');

      if (isAuthError) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        // For network or other errors, show alert but don't logout
        Alert.alert(
          'Network Error',
          'Failed to fetch timeline. Please check your connection and try again.',
          [{
            text: 'OK',
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Retry',
            onPress: () => fetchTimeline(refresh)
          }],
        );
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [type]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    setMaxId(null);
    fetchTimeline(true);
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      fetchTimeline();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  if (isLoading) return <Loading />;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={isFetchingMore ? <Loading /> : null}
      />
    </View>
  );
}
