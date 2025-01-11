import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PostCard } from '@/components/protected/PostCard';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Post, StatusResponse } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [thread, setThread] = useState<{
    ancestors: Post[];
    mainPost: Post | null;
    descendants: Post[];
  }>({
    ancestors: [],
    mainPost: null,
    descendants: [],
  });

  const fetchRepliesRecursively = async (
    postId: string,
    server: string,
    currentDepth: number = 0
  ): Promise<Post[]> => {
    // Stop recursion if we've reached depth 2
    if (currentDepth >= 2) {
      return [];
    }

    try {
      const response: StatusResponse = await ApiService.getStatus(server, postId);
      const replies = response.context.descendants;

      const repliesWithChildren = await Promise.all(
        replies.map(async (reply) => {
          const childReplies = await fetchRepliesRecursively(reply.id, server, currentDepth + 1);
          return {
            ...reply,
            replies: childReplies,
          };
        })
      );

      return repliesWithChildren;
    } catch (error) {
      console.error(`Error fetching replies for post ${postId}:`, error);
      return [];
    }
  };

  const fetchThread = async () => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response: StatusResponse = await ApiService.getStatus(server, id);

      const repliesWithChildren = await fetchRepliesRecursively(id, server, 0);

      setThread({
        ancestors: response.context.ancestors,
        mainPost: response.status,
        descendants: repliesWithChildren,
      });
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchThread();
  };

  const renderPost = (post: Post, depth: number = 0) => {
    if (depth >= 2) {
      return null;
    }

    const indentStyle = {
      marginLeft: depth * 16,
      borderLeftWidth: depth == 0 ? 0 : 1,
    };

    const postStyle = {
      padding: 12,
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
    };

    return (
      <View key={post.id} style={[indentStyle, postStyle]}>
        <PostCard post={post} />
        {post.replies?.map((reply) => renderPost(reply, depth + 1))}
      </View>
    );
  };

  const getHeaderTitle = () => {
    if (!thread.mainPost?.account?.username) {
      return 'Replies';
    }
    return `Replies to ${thread.mainPost.account.display_name}'s post`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
      color: theme.colors.text,
    },
    backButton: {
      padding: 8,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: getHeaderTitle(),
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          presentation: 'transparentModal',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.background}
            />
          }
        >
          {thread.ancestors.map((post) => renderPost(post, 0))}
          {thread.mainPost && renderPost(thread.mainPost, 0)}
          {thread.descendants.map((post) => renderPost(post, 1))}
        </ScrollView>
      )}
    </>
  );
}
