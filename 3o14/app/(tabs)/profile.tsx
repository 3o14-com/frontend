import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Text,
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as const,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditableProfile(prev => ({
        ...prev,
        [type]: base64Image,
      }));
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

  const handleSaveProfile = async (formValues: { display_name: string; bio: string }) => {
    if (!profile.account) return;

    try {
      setIsSaving(true);
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      setEditableProfile(prev => ({
        ...prev,
        display_name: formValues.display_name,
        bio: formValues.bio
      }));

      await ApiService.updateProfile(server, {
        display_name: formValues.display_name,
        note: formValues.bio,
        header: editableProfile.header,
      });

      setProfile(prev => ({
        ...prev,
        account: prev.account ? {
          ...prev.account,
          display_name: formValues.display_name,
          note: formValues.bio,
          header: editableProfile.header || prev.account.header,
        } : null,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
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
      bio: stripHtml(editableProfile.bio)
    });

    function stripHtml(html: string): string {
      const withLineBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p>/gi, '');
      return withLineBreaks.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    return (
      <ScrollView style={styles.editingContainer} keyboardShouldPersistTaps="handled">
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
