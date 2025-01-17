import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { ProfileHeader } from '@/components/common/Profile/ProfileHeader';
import { ProfilePosts } from '@/components/common/Profile/ProfilePosts';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // Prevent multiple fetches
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const [profile, setProfile] = useState<{
    account: Account | null;
    posts: Post[];
  }>({
    account: null,
    posts: [],
  });

  useEffect(() => {
    if (profile.account) {
      fetchRelationship();
    }
  }, [profile.account]);

  const fetchRelationship = async () => {
    if (!profile.account) return;

    try {
      const server = await StorageService.get('server');
      if (!server) return;

      const relationship = await ApiService.getRelationship(server, profile.account.id);
      setIsFollowing(relationship.following);
    } catch (error) {
      console.error('Error fetching relationship:', error);
    }
  };

  const handleFollowPress = async () => {
    if (!profile.account) return;

    const server = await StorageService.get('server');
    if (!server) {
      Alert.alert('Error', 'Server not configured');
      return;
    }

    try {
      setIsFollowing(!isFollowing);

      if (isFollowing) {
        await ApiService.unfollowAccount(server, profile.account.id);
        setProfile((prev) => ({
          ...prev,
          account: prev.account
            ? { ...prev.account, followers_count: prev.account.followers_count - 1 }
            : null,
        }));
      } else {
        await ApiService.followAccount(server, profile.account.id);
        setProfile((prev) => ({
          ...prev,
          account: prev.account
            ? { ...prev.account, followers_count: prev.account.followers_count + 1 }
            : null,
        }));
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      setIsFollowing(!isFollowing); // Revert state on failure
      Alert.alert('Error', 'Could not update follow status. Please try again.');
    }
  };

  const fetchProfile = async (refresh = false) => {
    if (isFetching) return; // Prevent duplicate fetches

    setIsFetching(true);

    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response = await ApiService.getProfile(
        server,
        username,
        refresh ? undefined : maxId
      );

      const { account, posts } = response;

      setProfile((prev) => ({
        account: refresh ? account : prev.account,
        posts: refresh
          ? posts || []
          : [
            ...prev.posts.filter((post) => !posts?.some((newPost) => newPost.id === post.id)),
            ...(posts || []),
          ],
      }));

      if (posts?.length > 0) {
        setMaxId(posts[posts.length - 1].id);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not fetch profile. Please try again.');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchProfile(true);
  }, [username]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMorePosts(true);
    setMaxId(null);
    fetchProfile(true);
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMorePosts) {
      setIsFetchingMore(true);
      fetchProfile();
    }
  };

  const navigateToFollowers = () => {
    if (profile.account) {
      router.push(`/(modals)/profile/${username}/followers`);
    }
  };

  const navigateToFollowing = () => {
    if (profile.account) {
      router.push(`/(modals)/profile/${username}/following`);
    }
  };

  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile.account) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: username,
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
          presentation: 'transparentModal',
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 8 }} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ProfilePosts
        posts={profile.posts}
        isRefreshing={isRefreshing}
        isFetchingMore={isFetchingMore}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        theme={theme}
        ListHeaderComponent={() => (
          <ProfileHeader
            account={profile.account!}
            isFollowing={isFollowing}
            onFollowPress={handleFollowPress}
            onFollowersPress={navigateToFollowers}
            onFollowingPress={navigateToFollowing}
            isLoading={isLoading}
            theme={theme}
          />
        )}
      />
    </>
  );
}
