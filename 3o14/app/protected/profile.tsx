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
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PostCard } from '@/components/protected/PostCard';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';


interface EditableProfile {
  display_name: string;
  bio: string;
  avatar?: string;
  header?: string;
}


export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);


  const handleLogout = async () => {
    try {
      await StorageService.clear();

      router.push('/');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const [profile, setProfile] = useState<{
    account: Account | null;
    posts: Post[];
  }>({
    account: null,
    posts: [],
  });

  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    display_name: '',
    bio: '',
  });

  useEffect(() => {
    if (profile.account) {
      setEditableProfile({
        display_name: profile.account.display_name,
        bio: profile.account.bio || '',
      });
    }
  }, [profile.account]);

  const pickImage = async (type: 'avatar' | 'header') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditableProfile(prev => ({
        ...prev,
        [type]: base64Image,
      }));
    }
  };


  const handleSaveProfile = async () => {
    if (!profile.account) return;

    try {
      setIsSaving(true);
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      await ApiService.updateProfile(server, {
        display_name: editableProfile.display_name,
        note: editableProfile.bio,
        header: editableProfile.header,
      });

      setProfile(prev => ({
        ...prev,
        account: prev.account ? {
          ...prev.account,
          display_name: editableProfile.display_name,
          bio: editableProfile.bio,
          header: editableProfile.header || prev.account.header,
        } : null,
      }));

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile(true);
    }
  }, [user]);

  const fetchProfile = async (refresh = false) => {
    if (!user) return;

    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const response = await ApiService.getProfile(
        server,
        user.username,
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

        if (!refresh && posts.length > 0) {
          setMaxId(posts[posts.length - 1].id);
        }
      } else {
        setHasMorePosts(false);
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
  }, [user]);

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
      router.push(`/screens/profile/${user?.username}/followers`);
    }
  };

  const navigateToFollowing = () => {
    if (profile.account) {
      router.push(`/screens/profile/${user?.username}/following`);
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
    postList: {
      marginTop: 16,
    },
    editButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      alignSelf: 'center',
      backgroundColor: theme.colors.primary,
      minWidth: 120,
      alignItems: 'center',
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.small,
      padding: 8,
      marginTop: 8,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    editingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      borderWidth: 0,
      gap: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    saveButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    imagePickerButton: {
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
    },
    logoutButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      alignSelf: 'center',
      backgroundColor: theme.colors.error,
      minWidth: 120,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  const renderEditingForm = () => (
    <ScrollView style={styles.profileInfo}>
      <TextInput
        style={[styles.input, styles.displayName]}
        value={editableProfile.display_name}
        onChangeText={(text) => setEditableProfile(prev => ({ ...prev, display_name: text }))}
        placeholder="Display Name"
        placeholderTextColor={theme.colors.textSecondary}
      />

      <Text style={styles.username}>@{profile.account?.username}</Text>

      <TextInput
        style={[styles.input, styles.bio]}
        value={editableProfile.bio}
        onChangeText={(text) => setEditableProfile(prev => ({ ...prev, bio: text }))}
        placeholder="Bio"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
      />

      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={() => pickImage('avatar')}
      >
        <Text style={{ color: '#FFFFFF' }}>Change Avatar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={() => pickImage('header')}
      >
        <Text style={{ color: '#FFFFFF' }}>Change Header</Text>
      </TouchableOpacity>

      <View style={styles.editingContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setIsEditing(false)}
          disabled={isSaving}
        >
          <Text style={{ color: theme.colors.text }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomWidth: 0,
          } as any,
          headerTintColor: theme.colors.text,
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
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={() => (
            profile.account && (
              <>
                <Image
                  source={{ uri: editableProfile.header || profile.account.header }}
                  style={styles.headerImage}
                />
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: editableProfile.avatar || profile.account.avatar }}
                    style={styles.avatar}
                  />
                </View>
                {isEditing ? (
                  renderEditingForm()
                ) : (
                  <View style={styles.profileInfo}>
                    <Text style={styles.displayName}>{profile.account.display_name}</Text>
                    <Text style={styles.username}>@{profile.account.username}</Text>
                    <Text style={styles.bio}>{profile.account.bio}</Text>

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditing(true)}
                      >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                      >
                        <Text style={styles.logoutButtonText}>Logout</Text>
                      </TouchableOpacity>
                    </View>

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
                )}
              </>
            )
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
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
