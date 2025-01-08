import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  RefreshControl,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followers, setFollowers] = useState<Account[]>([]);
  const [nextPage, setNextPage] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [server, setServer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to process followers one by one
  const processFollowers = useCallback(async (accounts: Account[]) => {
    setIsProcessing(true);
    for (const account of accounts) {
      setFollowers(prev => {
        if (prev.some(f => f.acct === account.id)) return prev;
        return [...prev, account];
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setIsProcessing(false);
  }, []);

  const fetchFollowers = useCallback(
    async (page?: string) => {
      if (!server || !accountId) return;

      try {
        const response = await ApiService.getFollowers(server, accountId, page);

        if (page) {
          processFollowers(response.accounts);
        } else {
          setFollowers([]);
          processFollowers(response.accounts);
        }

        setNextPage(response.next_page);
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [server, accountId, processFollowers]
  );

  const fetchAccountId = useCallback(async () => {
    try {
      const serverUrl = await StorageService.get('server');
      if (!serverUrl) return;
      setServer(serverUrl);

      const response = await ApiService.getProfile(serverUrl, username);
      setAccountId(response.account.id);
    } catch (error) {
      console.error('Error fetching account ID:', error);
    }
  }, [username]);

  useEffect(() => {
    const init = async () => {
      await fetchAccountId();
    };
    init();
  }, [fetchAccountId]);

  useEffect(() => {
    if (accountId) {
      fetchFollowers();
    }
  }, [accountId, fetchFollowers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFollowers();
  };

  const handleLoadMore = () => {
    if (nextPage && !isLoadingMore && !isProcessing) {
      setIsLoadingMore(true);
      fetchFollowers(nextPage);
    }
  };

  const navigateToProfile = (account: string | undefined) => {
    router.push(`/screens/profile/${account}`);
  };

  const openWebView = useCallback(() => {
    if (server && username) {
      const url = `https://${server}/@${username}/followers`;
      Linking.openURL(url);
    }
  }, [server, username]);

  const renderItem = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountItem}
      onPress={() => navigateToProfile(item.acct)}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.accountInfo}>
        <Text style={[styles.displayName, { color: theme.colors.text }]}>
          {item.display_name}
        </Text>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          @{item.acct}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accountItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    accountInfo: {
      marginLeft: 12,
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    username: {
      fontSize: 14,
    },
    footer: {
      padding: 16,
      alignItems: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Followers',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 0,
          } as any,
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 8 }} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={{ padding: 8 }} onPress={openWebView}>
              <Ionicons name="globe-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        style={styles.container}
        data={followers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
          isLoadingMore || isProcessing ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
      />
    </>
  );
}
