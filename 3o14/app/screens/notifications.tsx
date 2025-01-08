import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Notification } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '@/components/protected/PostCard';

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (refresh = false) => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response = await ApiService.getNotifications(
        server,
      );

      if (response.notifications?.length > 0) {
        setNotifications((prev) =>
          refresh
            ? response.notifications
            : [
              ...prev.filter(
                (notification) =>
                  !response.notifications.some(
                    (newNotification) => newNotification.id === notification.id
                  )
              ),
              ...response.notifications,
            ]
        );

      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setHasMore(true);
    fetchNotifications(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      fetchNotifications();
    }
  }, [isFetchingMore, hasMore]);

  const handleClearAll = async () => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      await ApiService.clearNotifications(server);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const renderNotificationContent = ({ item }: { item: Notification }) => {
    const getNotificationIcon = () => {
      switch (item.type) {
        case 'mention':
          return 'at';
        case 'reblog':
          return 'repeat';
        case 'favourite':
          return 'heart';
        case 'follow':
          return 'person-add';
        case 'poll':
          return 'stats-chart';
        case 'follow_request':
          return 'person';
        default:
          return 'notifications';
      }
    };

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getNotificationIcon()}
            size={24}
            color={theme.colors.primary}
            style={styles.notificationIcon}
          />
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.account.display_name}</Text>
            {' '}
            {item.type === 'follow'
              ? 'followed you'
              : item.type === 'favourite'
                ? 'favorited your post'
                : item.type === 'reblog'
                  ? 'boosted your post'
                  : item.type === 'mention'
                    ? 'mentioned you'
                    : item.type === 'poll'
                      ? 'poll ended'
                      : 'requested to follow you'}
          </Text>
        </View>
        {item.status && <PostCard post={item.status} />}
      </View>
    );
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
    notificationItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationIcon: {
      marginRight: 12,
    },
    notificationText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    username: {
      fontWeight: 'bold',
    },
    clearButton: {
      padding: 8,
      marginRight: 16,
    },
    clearButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 0,
          } as any,
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
            >
              <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : null
          }
        />
      )}
    </>
  );
}
