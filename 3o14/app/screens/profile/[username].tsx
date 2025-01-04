import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Text
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PostCard } from '@/components/protected/PostCard';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<{
    account: Account | null;
    posts: Post[];
  }>({
    account: null,
    posts: [],
  });

  useEffect(() => {
    // Fetch relationship status when profile loads
    const fetchRelationship = async () => {
      if (profile.account) {
        try {
          const server = await StorageService.get('server');
          if (!server) return;

          const relationship = await ApiService.getRelationship(server, profile.account.id);
          setIsFollowing(relationship.following);
        } catch (error) {
          console.error('Error fetching relationship:', error);
        }
      }
    };

    fetchRelationship();
  }, [profile.account]);

  const handleFollowPress = async () => {
    if (!profile.account) return;

    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      // Optimistically update the UI
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
      // Revert UI update if API call fails
      setIsFollowing(isFollowing);
    }
  };

  const fetchProfile = async () => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response = await ApiService.getProfile(server, username);
      setProfile({
        account: response.account,
        posts: response.posts,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const navigateToFollowers = () => {
    if (profile.account) {
      router.push(`/screens/profile/${username}/followers`);
    }
  };

  const navigateToFollowing = () => {
    if (profile.account) {
      router.push(`/screens/profile/${username}/following`);
    }
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
    headerImage: {
      width: '100%',
      height: 150,
    },
    avatarContainer: {
      marginTop: -40,
      marginLeft: 16,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: theme.colors.background,
      width: 80,

      height: 80,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    profileInfo: {
      padding: 16,
    },
    displayName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    username: {
      fontSize: 16,
      color: theme.colors.text,
      marginTop: 4,
    },
    bio: {
      fontSize: 16,
      color: theme.colors.text,
      marginTop: 12,
    },
    stats: {
      flexDirection: 'row',
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 4,
    },
    postsContainer: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    followButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      alignSelf: 'center',
    },
    followButtonText: {
      fontSize: 16,
      fontWeight: '600',
    }
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: username,
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
            />
          }
        >
          {profile.account && (
            <>
              <Image
                source={{ uri: profile.account.header }}
                style={styles.headerImage}
              />
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profile.account.avatar }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{profile.account.display_name}</Text>
                <Text style={styles.username}>@{profile.account.username}</Text>
                <Text style={styles.bio}>{profile.account.bio}</Text>
                <View style={styles.stats}>
                  <TouchableOpacity style={styles.stat} onPress={navigateToFollowers}>
                    <Text style={styles.statNumber}>
                      {profile.account.followers_count.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stat} onPress={navigateToFollowing}>
                    <Text style={styles.statNumber}>
                      {profile.account.following_count.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  {
                    backgroundColor: isFollowing ? theme.colors.background : theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={handleFollowPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: isFollowing ? theme.colors.primary : "#FFFFFF" },
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.postsContainer}>
                {profile.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </>
  );
}
