import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const isNearTop = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout>();
  const seenPostIds = useRef(new Set<string>());
  const newestSeenPostId = useRef<string | null>(null);
  const scrollThreshold = 1000;

  // Helper function to track seen posts
  const trackSeenPosts = (newPosts: Post[]) => {
    newPosts.forEach(post => {
      seenPostIds.current.add(post.id);
    });
    if (newPosts.length > 0) {
      newestSeenPostId.current = newPosts[0].id;
    }
  };

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
  };

  const checkNewPosts = useCallback(async () => {
    if (!newestSeenPostId.current) return;

    try {
      const server = await StorageService.get('server');
      if (!server) return;

      const fetchFunction = type === 'home'
        ? ApiService.getHomeTimeline
        : ApiService.getLocalTimeline;

      const newData = await fetchFunction(server, undefined);

      // Filter out posts we've already seen
      const trulyNewPosts = newData.filter(post => !seenPostIds.current.has(post.id));

      if (trulyNewPosts.length > 0) {
        if (isNearTop.current) {
          setPosts(prevPosts => [...trulyNewPosts, ...prevPosts]);
          trackSeenPosts(trulyNewPosts);
          setNewPosts([]);
          setShowNewPostsBanner(false);
        } else {
          setNewPosts(trulyNewPosts);
          setShowNewPostsBanner(true);
        }
      }
    } catch (error) {
      console.error('New posts check failed:', error);
    }
  }, [type]);

  useEffect(() => {
    pollingInterval.current = setInterval(checkNewPosts, 30000);
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [checkNewPosts]);

  useEffect(() => {
    fetchTimeline();
  }, [type]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    setMaxId(null);
    setNewPosts([]);
    setShowNewPostsBanner(false);
    // Don't clear seenPostIds here as we want to maintain history
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
    isNearTop.current = currentOffset < 200;

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

  const handleNewPostsPress = () => {
    setPosts(prevPosts => [...newPosts, ...prevPosts]);
    trackSeenPosts(newPosts);
    setNewPosts([]);
    setShowNewPostsBanner(false);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const scrollToTopAndRefresh = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    handleRefresh();
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    newPostsBanner: {
      position: 'absolute',
      top: 10,
      alignSelf: 'center',
      width: 'auto',
      height: 44,
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      alignItems: 'center',
      zIndex: 1000,
    },
    newPostsText: {
      color: '#fff',
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

      {showNewPostsBanner && newPosts.length > 0 && (
        <TouchableOpacity
          style={styles.newPostsBanner}
          onPress={handleNewPostsPress}
          activeOpacity={0.8}
        >
          <Text style={styles.newPostsText}>
            New Posts
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
          onPress={scrollToTopAndRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
