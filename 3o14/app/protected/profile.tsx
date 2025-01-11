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
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PostCard } from '@/components/protected/PostCard';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Account, Post } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ContentRenderer } from '@/components/common/ContentRenderer';
import { defaultSystemFonts } from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import Confirm from '@/components/common/Confirm';


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
  const { width } = useWindowDimensions();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleNotification = () => {
    router.push('/screens/notifications');
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
    postContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });

  const renderEditingForm = () => {
    const [formValues, setFormValues] = useState({
      display_name: editableProfile.display_name,
      bio: stripHtml(editableProfile.bio)
    });

    function stripHtml(html: string): string {
      // Replace <br> with \n and <p> with \n\n for proper line breaks
      const withLineBreaks = html
        .replace(/<br\s*\/?>/gi, '\n') // Handle <br> tags
        .replace(/<\/p>/gi, '\n\n')   // Handle </p> tags for paragraph endings
        .replace(/<p>/gi, '');        // Remove opening <p> tags

      // Strip remaining HTML tags
      return withLineBreaks.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    const handleSaveProfile = async () => {
      if (!profile.account) return;

      try {
        setIsSaving(true);
        const server = await StorageService.get('server');
        if (!server) throw new Error('Server not configured');

        // Update editableProfile only when saving
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
            bio: formValues.bio,
            header: editableProfile.header || prev.account.header,
          } : null,
        }));

        setIsEditing(false);
        console.log('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <ScrollView
        style={styles.profileInfo}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[styles.input, styles.displayName]}
          value={formValues.display_name}
          onChangeText={(text) => setFormValues(prev => ({ ...prev, display_name: text }))}
          placeholder="Display Name"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.username}>@{profile.account?.username}</Text>

        <TextInput
          style={[styles.input, styles.bio]}
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
  };

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
              <>
                <TouchableOpacity onPress={() => setShowLogoutConfirm(true)}>
                  <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                </TouchableOpacity>

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
                      onPress: handleLogout,
                      destructive: true,
                      icon: 'log-out-outline'
                    },
                  ]}
                  onClose={() => setShowLogoutConfirm(false)}
                />
              </>
            </View>
          ),
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
              <TouchableOpacity onPress={handleNotification}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          style={styles.container}
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

                    <ContentRenderer
                      content={profile.account.note}
                      width={width}
                      tagsStyles={tagsStyles}
                      renderersProps={renderersProps}
                      systemFonts={systemFonts}
                    />

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
