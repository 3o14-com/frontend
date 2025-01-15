import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, StatusBar, Alert, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { PostCard } from '@/components/protected/PostCard';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Post } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';

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
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);

  const { logout } = useAuth();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const lastScrollY = useRef(0);
  const checkInterval = useRef<NodeJS.Timeout>();
  const SCROLL_THRESHOLD = 1000;
  const CHECK_INTERVAL = 60000;

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
      const errorMessage = error instanceof Error ? error.message : '';
      const isAuthError = errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden');

      if (isAuthError) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        Alert.alert(
          'Network Error',
          'Failed to fetch timeline. Please try again later.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleCheckNewPosts = useCallback(async () => {
    if (showNewPostsBanner) return;

    try {
      const server = await StorageService.get('server');
      if (!server) return;

      const fetchFunction = type === 'home'
        ? ApiService.getHomeTimeline
        : ApiService.getLocalTimeline;

      const newestCurrentPost = posts[0]?.id;
      if (!newestCurrentPost) return;

      const newData = await fetchFunction(server, undefined);
      const newPostsIndex = newData.findIndex(post => post.id === newestCurrentPost);

      if (newPostsIndex > 0) {
        setNewPostsCount(newPostsIndex);
        setShowNewPostsBanner(true);
      }
    } catch (error) {
      console.error('Failed to check new posts:', error);
    }
  }, [showNewPostsBanner, posts, type]);

  // Set up interval for checking new posts
  useEffect(() => {
    if (showNewPostsBanner) {
      // Clear interval if banner is showing
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = undefined;
      }
    } else {
      // Start interval if banner is not showing
      checkInterval.current = setInterval(handleCheckNewPosts, CHECK_INTERVAL);
    }

    // Cleanup function
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [handleCheckNewPosts, showNewPostsBanner]);

  // Initial timeline fetch
  useEffect(() => {
    fetchTimeline();
  }, [type]);

  const scrollToTopAndRefresh = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsRefreshing(true);
    setHasMore(true);
    setMaxId(null);
    setNewPostsCount(0);
    setShowNewPostsBanner(false);
    fetchTimeline(true);
  }, []);

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      fetchTimeline();
    }
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const isScrollingUp = currentOffset < lastScrollY.current;

    if (currentOffset > SCROLL_THRESHOLD) {
      setShowScrollTop(isScrollingUp && !isFetchingMore);
    } else {
      setShowScrollTop(false);
    }

    lastScrollY.current = currentOffset;
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
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.7,
    },
    newPostsBanner: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      alignItems: 'center',
      textAlign: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 15,
      opacity: 0.7,
      borderRadius: 100,
      zIndex: 1000,
    },
    bannerText: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
  });

  if (isLoading) return <Loading />;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />

      {showNewPostsBanner && (
        <TouchableOpacity
          style={styles.newPostsBanner}
          onPress={scrollToTopAndRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="newspaper" size={20} color={theme.colors.text} />
          <Text style={styles.bannerText}>
            {newPostsCount} New
          </Text>
        </TouchableOpacity>
      )}

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
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={scrollToTopAndRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.background}
          />
        }
        ListFooterComponent={isFetchingMore ? <Loading /> : null}
      />

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={scrollToTopAndRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}
