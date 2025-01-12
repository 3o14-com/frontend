import React from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { PostCard } from '@/components/protected/PostCard';
import { Post } from '@/types/api';

interface ProfilePostsProps {
  posts: Post[];
  isRefreshing: boolean;
  isFetchingMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  theme: any;
}

export const ProfilePosts: React.FC<ProfilePostsProps> = ({
  posts,
  isRefreshing,
  isFetchingMore,
  onRefresh,
  onLoadMore,
  ListHeaderComponent,
  theme,
}) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    postContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item }) => (
        <View style={styles.postContainer}>
          <PostCard post={item} />
        </View>
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.background}
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingMore ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : null
      }
    />
  );
};
