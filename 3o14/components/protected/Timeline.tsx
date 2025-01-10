import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, StyleSheet, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '@/components/protected/PostCard';
import { Loading } from '@/components/common/Loading';
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const lastOffset = useRef(0);
  const scrollThreshold = 1000;

  const fetchTimeline = async (refresh = false) => {
    try {
      const server = await StorageService.get('server');
      if (!server) {
        console.error('Server configuration not found. Please login again.');
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
      console.error('Session check failed:', error);
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

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    if (currentOffset > scrollThreshold) {
      if (currentOffset < lastOffset.current) {
        setShowScrollTop(true);
      } else if (currentOffset > lastOffset.current) {
        setShowScrollTop(false);
      }
    } else {
      setShowScrollTop(false);
    }

    lastOffset.current = currentOffset;
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    postContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    scrollTopButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
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
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <PostCard post={item} />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
