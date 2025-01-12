import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { ContentRenderer } from '@/components/common/ContentRenderer';
import { Account } from '@/types/api';
import { defaultSystemFonts } from 'react-native-render-html';

interface ProfileHeaderProps {
  account: Account;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  onFollowPress?: () => void;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  isLoading?: boolean;
  theme: any;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  account,
  isFollowing,
  isOwnProfile,
  onFollowPress,
  onFollowersPress,
  onFollowingPress,
  isLoading,
  theme,
}) => {
  const { width } = useWindowDimensions();
  const systemFonts = [...defaultSystemFonts];

  const styles = StyleSheet.create({
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
  });

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
      <Image
        source={{ uri: account.header }}
        style={styles.headerImage}
      />
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: account.avatar }}
          style={styles.avatar}
        />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.displayName}>{account.display_name}</Text>
        <Text style={styles.username}>@{account.username}</Text>

        <ContentRenderer
          content={account.note}
          width={width}
          tagsStyles={tagsStyles}
          renderersProps={renderersProps}
          systemFonts={systemFonts}
        />

        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followButton,
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
                  styles.followButtonText,
                  { color: isFollowing ? theme.colors.primary : "#FFFFFF" },
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        <View style={styles.stats}>
          <TouchableOpacity style={styles.stat} onPress={onFollowersPress}>
            <Text style={styles.statNumber}>
              {account.followers_count.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stat} onPress={onFollowingPress}>
            <Text style={styles.statNumber}>
              {account.following_count.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};


