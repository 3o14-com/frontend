import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Confirm from '@/components/common/Confirm';
import { ProfileHeader } from '@/components/common/Profile/ProfileHeader';
import { ProfilePosts } from '@/components/common/Profile/ProfilePosts';

interface EditableProfile {
  display_name: string;
  bio: string;
  avatar?: string;
  header?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [maxId, setMaxId] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    avatar: undefined,
    header: undefined,
  });

  useEffect(() => {
    if (profile.account) {
      setEditableProfile({
        display_name: profile.account.display_name,
        bio: profile.account.note || '',
      });
    }
  }, [profile.account]);

  const pickImage = async (type: 'avatar' | 'header') => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to update your profile images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as const,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setEditableProfile(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const fetchProfile = async (refresh = false) => {
    if (!user || fetchError) return; // Prevent fetching if there's already an error

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
      setFetchError(false); // Reset error state on success
    } catch (error) {
      console.error('Error fetching profile:', error);
      setFetchError(true); // Set error state on failure
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && !fetchError) {
      fetchProfile(true);
    }
  }, [user, fetchError]); // Add fetchError dependency

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
      router.push(`/(modals)/(profile)/${user?.username}/followers`);
    }
  };

  const navigateToFollowing = () => {
    if (profile.account) {
      router.push(`/(modals)/(profile)/${user?.username}/following`);
    }
  };

  const handleNotification = () => {
    router.push('/(modals)/notifications');
  };

  const handleSaveProfile = async (formValues: {
    display_name: string;
    bio: string;
    avatar?: string;
    header?: string;
  }) => {
    if (!profile.account) return;

    try {
      setIsSaving(true);
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      setEditableProfile(prev => ({
        ...prev,
        display_name: formValues.display_name,
        bio: formValues.bio,
        avatar: formValues.avatar,
        header: formValues.header,
      }));

      await ApiService.updateProfile(server, {
        display_name: formValues.display_name,
        note: formValues.bio,
        avatar: formValues.avatar,
        header: formValues.header,
      });

      handleRefresh();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = StyleSheet.create({
    imageContainer: {
      width: '100%',
      marginBottom: 16,
      borderRadius: theme.borderRadius.medium,
      overflow: 'hidden',
    },
    headerImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    headerPlaceholder: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 8,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 14,
      marginTop: 4,
    },
    placeholderText: {
      marginTop: 8,
      fontSize: 14,
    },
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
    editingContainer: {
      padding: 16,
      backgroundColor: theme.colors.background,
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
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
    },
    imagePickerButton: {
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
    },
  });

  const renderEditingForm = () => {
    const [formValues, setFormValues] = useState({
      display_name: editableProfile.display_name,
      bio: stripHtml(editableProfile.bio),
      avatar: editableProfile.avatar,
      header: editableProfile.header,
    });

    function stripHtml(html: string): string {
      const withLineBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p>/gi, '');
      return withLineBreaks.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.editingContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Image Picker */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => pickImage('header')}
        >
          {formValues.header ? (
            <Image
              source={{ uri: formValues.header }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.headerPlaceholder}>
              <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Tap to update header image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar Image Picker */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => pickImage('avatar')}
        >
          {formValues.avatar ? (
            <Image
              source={{ uri: formValues.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={32} color={theme.colors.textSecondary} />
            </View>
          )}
          <Text style={[styles.avatarText, { color: theme.colors.textSecondary }]}>
            Tap to update profile picture
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={formValues.display_name}
          onChangeText={(text) => setFormValues(prev => ({ ...prev, display_name: text }))}
          placeholder="Display Name"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TextInput
          style={[styles.input, { marginTop: 16, minHeight: 100 }]}
          value={formValues.bio}
          onChangeText={(text) => setFormValues(prev => ({ ...prev, bio: text }))}
          placeholder="Bio"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => setIsEditing(false)}
            disabled={isSaving}
          >
            <Text style={{ color: theme.colors.text }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleSaveProfile(formValues)}
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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderHeader = () => {
    if (!profile.account) return null;

    if (isEditing) {
      return renderEditingForm();
    }

    return (
      <ProfileHeader
        account={profile.account}
        isOwnProfile={true}
        onFollowersPress={navigateToFollowers}
        onFollowingPress={navigateToFollowing}
        theme={theme}
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: theme.colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="create-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLogoutConfirm(true)}>
                <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={handleNotification}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        <ProfilePosts
          posts={profile.posts}
          isRefreshing={isRefreshing}
          isFetchingMore={isFetchingMore}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          ListHeaderComponent={renderHeader}
          theme={theme}
        />
      </View>

      <Confirm
        visible={showLogoutConfirm}
        message="Are you sure you want to logout?"
        extraMessage="You'll need to sign in again to access your account."
        options={[
          {
            text: 'Cancel',
            onPress: () => setShowLogoutConfirm(false),
            icon: 'close-outline'
          },
          {
            text: 'Logout',
            onPress: logout,
            destructive: true,
            icon: 'log-out-outline'
          },
        ]}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
