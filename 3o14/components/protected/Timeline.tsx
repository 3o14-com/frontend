import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Text, View, FlatList, StyleSheet, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
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

// Memoized PostCard wrapper component
const MemoizedPostCard = memo(({ post }: { post: Post }) => (
  <View style={styles.postContainer}>
    <PostCard post={post} />
  </View>
));

// Extracted styles to prevent recreation on each render
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postContainer: {
    borderBottomWidth: 1,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newPostsBanner: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 'auto',
    height: 44,
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  newPostsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export function Timeline({ type }: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const lastOffset = useRef(0);
  const pollingInterval = useRef<NodeJS.Timeout>();
  const seenPostIds = useRef(new Set<string>());
  const newestSeenPostId = useRef<string | null>(null);
  const scrollThreshold = 1000;

  // Memoized render item function
  const renderItem = useCallback(({ item }: { item: Post }) => (
    <MemoizedPostCard post={item} />
  ), []);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Post) => item.id, []);

  // Memoized list empty component
  const ListEmptyComponent = useCallback(() => (
    <Text style={{ textAlign: 'center', marginTop: 20 }}>No posts available</Text>
  ), []);

  // Memoized list footer component
  const ListFooterComponent = useCallback(() => (
    isFetchingMore ? <Loading /> : null
  ), [isFetchingMore]);

  // Helper function to track seen posts
  const trackSeenPosts = useCallback((newPosts: Post[]) => {
    newPosts.forEach(post => {
      seenPostIds.current.add(post.id);
    });
    if (newPosts.length > 0) {
      newestSeenPostId.current = newPosts[0].id;
    }
  }, []);

  const fetchTimeline = useCallback(async (refresh = false) => {
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
        setPosts(prevPosts => {
          const newPostsList = refresh ? data : [...prevPosts, ...data];
          trackSeenPosts(data);
          return newPostsList;
        });
        setMaxId(data[data.length - 1].id);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Timeline fetch failed:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, [type, maxId, trackSeenPosts]);

  const checkNewPosts = useCallback(async () => {
    if (!newestSeenPostId.current) return;

    try {
      const server = await StorageService.get('server');
      if (!server) return;

      const fetchFunction = type === 'home'
        ? ApiService.getHomeTimeline
        : ApiService.getLocalTimeline;

      const newData = await fetchFunction(server, undefined);
      const trulyNewPosts = newData.filter(post => !seenPostIds.current.has(post.id));

      if (trulyNewPosts.length > 0) {
        setNewPosts(trulyNewPosts);
        setShowNewPostsBanner(true);
      }
    } catch (error) {
      console.error('New posts check failed:', error);
    }
  }, [type]);

  useEffect(() => {
    pollingInterval.current = setInterval(checkNewPosts, 60000);
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [checkNewPosts]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setHasMore(true);
    setMaxId(null);
    setNewPosts([]);
    setShowNewPostsBanner(false);
    fetchTimeline(true);
  }, [fetchTimeline]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      fetchTimeline();
    }
  }, [isFetchingMore, hasMore, fetchTimeline]);

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    if (currentOffset > scrollThreshold) {
      setShowScrollTop(currentOffset < lastOffset.current);
    } else {
      setShowScrollTop(false);
    }

    lastOffset.current = currentOffset;
  }, []);

  const handleNewPostsPress = useCallback(() => {
    setPosts(prevPosts => [...newPosts, ...prevPosts]);
    trackSeenPosts(newPosts);
    setNewPosts([]);
    setShowNewPostsBanner(false);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [newPosts, trackSeenPosts]);

  const scrollToTopAndRefresh = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    handleRefresh();
  }, [handleRefresh]);

  // Memoized dynamic styles
  const dynamicStyles = useCallback(() => ({
    container: {
      ...styles.container,
      backgroundColor: theme.colors.background,
    },
    postContainer: {
      ...styles.postContainer,
      borderBottomColor: theme.colors.border,
    },
    scrollTopButton: {
      ...styles.scrollTopButton,
      backgroundColor: theme.colors.primary,
    },
    newPostsBanner: {
      ...styles.newPostsBanner,
      backgroundColor: theme.colors.primary,
    },
  }), [theme.colors]);

  if (isLoading) return <Loading />;

  const currentStyles = dynamicStyles();

  return (
    <View style={currentStyles.container}>
      <StatusBar
        barStyle={theme.colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />

      {showNewPostsBanner && newPosts.length > 0 && (
        <TouchableOpacity
          style={currentStyles.newPostsBanner}
          onPress={handleNewPostsPress}
          activeOpacity={0.8}
        >
          <Text style={styles.newPostsText}>
            {newPosts.length} New {newPosts.length === 1 ? 'Post' : 'Posts'}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.background}
          />
        }
      />

      {showScrollTop && (
        <TouchableOpacity
          style={currentStyles.scrollTopButton}
          onPress={scrollToTopAndRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
