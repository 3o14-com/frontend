import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Text,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PostCard } from '@/components/protected/PostCard';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { ContentRenderer } from '@/components/common/ContentRenderer';
import { defaultSystemFonts } from 'react-native-render-html';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<{
    account: Account | null;
    posts: Post[];
  }>({
    account: null,
    posts: [],
  });

  useEffect(() => {
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
      setIsFollowing(isFollowing);
    }
  };

  const fetchProfile = async (refresh = false) => {
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response = await ApiService.getProfile(
        server,
        username,
        refresh ? undefined : maxId
      );

      const { account, posts } = response;

      if (posts?.length > 0) {
        setProfile((prev) => ({
          account: refresh ? account : prev.account,
          posts: refresh
            ? posts
            : [
              ...prev.posts.filter(post => !posts.some(newPost => newPost.id === post.id)),
              ...posts,
            ],
        }));

        // Update maxId to the last post's ID only when fetching more posts
        if (!refresh && posts.length > 0) {
          setMaxId(posts[posts.length - 1].id); // Update maxId to the last post's ID
        }
      } else {
        setHasMorePosts(false); // Stop fetching if no more posts are available
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile(true);
  }, [username]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMorePosts(true);
    setMaxId(null);
    fetchProfile(true); // Pass `true` to indicate a refresh
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMorePosts) {
      setIsFetchingMore(true);
      fetchProfile();
    }
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
      backgroundColor: theme.colors.background,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    profileInfo: {
      padding: 16,
      backgroundColor: theme.colors.background,
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
      borderTopWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingTop: 16,
      paddingBottom: 16,
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
    },
    postList: {
      marginTop: 16,
    },
    postContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });

  const systemFonts = [...defaultSystemFonts];

  const tagsStyles = {
    body: {
      color: theme.colors.text,
      fontSize: 16,
    },
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'none' as const,
    },
    p: {
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
  };

  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

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
        <FlatList
          data={profile.posts}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <PostCard post={item} />
            </View>
          )}
          ListHeaderComponent={() => (
            profile.account && (
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

                  <ContentRenderer
                    content={profile.account.note}
                    width={width}
                    tagsStyles={tagsStyles}
                    renderersProps={renderersProps}
                    systemFonts={systemFonts}
                  />

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
              </>
            )
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.background}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
        />
      )}
    </>
  );
}
