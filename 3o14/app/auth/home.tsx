import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { PostCard } from '@/components/auth/PostCard';
import { TouchableButton } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Post } from '@/types/api';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { logout } = useAuth();
  const theme = useTheme();

  const fetchHomeTimeline = async (pageNumber = 1) => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not found');

      const data = await ApiService.getHomeTimeline(server, pageNumber);
      if (data.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...data.slice(0, 10)]);
        if (data.length < 10) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch home feed.');
      logout();
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchHomeTimeline();
  }, []);

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      setPage((prevPage) => prevPage + 1);
      fetchHomeTimeline(page + 1);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.large,
      backgroundColor: theme.colors.background,
    },
  });

  if (isLoading) return <Loading />;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingMore ? <Loading /> : null}
      />
      <TouchableButton title="Logout" onPress={logout} />
    </View>
  );
}
