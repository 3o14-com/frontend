import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Account } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';

interface AccountItemProps {
  account: Account;
  onPress: () => void;
  onFollowPress: () => void;
  isFollowing: boolean;
  isLoading: boolean;
}

const AccountItem = ({ account, onPress, onFollowPress, isFollowing, isLoading }: AccountItemProps) => {
  const theme = useTheme();

  const itemStyles = StyleSheet.create({
    accountItem: {
      flexDirection: 'row',
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    accountInfo: {
      marginLeft: theme.spacing.medium,
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    username: {
      fontSize: 14,
      opacity: 0.7,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      marginTop: 4,
      opacity: 0.7,
    },
    statItem: {
      marginRight: theme.spacing.medium,
      fontSize: 14,
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      minWidth: 100,
      alignItems: 'center',
      marginLeft: theme.spacing.small,
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={[itemStyles.accountItem, { borderColor: theme.colors.border }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: account.avatar }}
        style={itemStyles.avatar}
        defaultSource={require('@/assets/images/makuro.png')}
      />
      <View style={itemStyles.accountInfo}>
        <Text style={[itemStyles.displayName, { color: theme.colors.text }]}>
          {account.display_name}
        </Text>
        <Text style={[itemStyles.username, { color: theme.colors.text }]}>
          @{account.acct}
        </Text>
        <View style={itemStyles.statsContainer}>
          <Text style={[itemStyles.statItem, { color: theme.colors.text }]}>
            {account.followers_count?.toLocaleString() || 0} followers
          </Text>
          <Text style={[itemStyles.statItem, { color: theme.colors.text }]}>
            {account.following_count?.toLocaleString() || 0} following
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          itemStyles.followButton,
          {
            backgroundColor: isFollowing ? theme.colors.background : theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
        onPress={onFollowPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text
            style={[
              itemStyles.followButtonText,
              { color: isFollowing ? theme.colors.primary : "#FFFFFF" },
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({});
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const server = await StorageService.get('server');
      if (!server) {
        Alert.alert('Error', 'Server configuration not found. Please login again.');
        logout();
        return;
      }

      const accounts = await ApiService.searchAccounts(server, query.trim());
      setResults(accounts);

      // Fetch relationship status for each account
      const relationships = await Promise.all(
        accounts.map(account => ApiService.getRelationship(server, account.id))
      );

      const newFollowingStatus = relationships.reduce((acc, rel, index) => {
        acc[accounts[index].id] = rel.following;
        return acc;
      }, {} as { [key: string]: boolean });

      setFollowingStatus(newFollowingStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      if (errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden')) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        Alert.alert('Error', 'Failed to search. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowPress = async (account: Account) => {
    setLoadingStatus(prev => ({ ...prev, [account.id]: true }));
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const isCurrentlyFollowing = followingStatus[account.id];

      // Optimistically update UI
      setFollowingStatus(prev => ({ ...prev, [account.id]: !isCurrentlyFollowing }));

      if (isCurrentlyFollowing) {
        await ApiService.unfollowAccount(server, account.id);
      } else {
        await ApiService.followAccount(server, account.id);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      // Revert on error
      setFollowingStatus(prev => ({ ...prev, [account.id]: !prev[account.id] }));
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [account.id]: false }));
    }
  };

  const handleProfilePress = (account: Account) => {
    try {
      const username = account.acct || account.username;
      if (!username) {
        console.error('Could not determine username for profile navigation');
        return;
      }
      router.push(`/screens/profile/${username}`);
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 10,
    },
    searchContainer: {
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      fontSize: 16,
    },
    accountItem: {
      flexDirection: 'row',
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    accountInfo: {
      marginLeft: theme.spacing.medium,
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    username: {
      fontSize: 14,
      opacity: 0.7,
      marginTop: 2,
    },
    followers: {
      fontSize: 14,
      opacity: 0.7,
      marginTop: 2,
    },
    loadingContainer: {
      padding: theme.spacing.medium,
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      minWidth: 100,
      alignItems: 'center',
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    headerContainer: {
      paddingHorizontal: theme.spacing.medium,
      paddingBottom: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Search for People</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search for users..."
          placeholderTextColor={`${theme.colors.text}80`}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <AccountItem
              account={item}
              onPress={() => handleProfilePress(item)}
              onFollowPress={() => handleFollowPress(item)}
              isFollowing={followingStatus[item.id] || false}
              isLoading={loadingStatus[item.id] || false}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </View>
  );
}

