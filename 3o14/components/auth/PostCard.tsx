import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/types/api';
import RenderHTML, { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';
import { format } from 'date-fns';
import { LogBox } from 'react-native';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';

// Ignore specific log notifications
LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer: Support for defaultProps will be removed from function components in a future major release.',
  'Warning: MemoizedTNodeRenderer: Support for defaultProps will be removed from memo components in a future major release.',
  'Warning: TRenderEngineProvider: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

interface PostCardProps {
  post: Post;
  onLike?: (post: Post) => void;
  onRepost?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onRepost }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [server, setServer] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(post.favourited || false);
  const [isReposted, setIsReposted] = useState(post.reblogged || false);
  const [favouritesCount, setFavouritesCount] = useState(post.favourites_count || 0);
  const [reblogsCount, setReblogsCount] = useState(post.reblogs_count || 0);

  React.useEffect(() => {
    (async () => {
      const serverValue = await StorageService.get('server');
      setServer(serverValue);
    })();
  }, []);

  const handleLike = async () => {
    try {
      if (!server) return Alert.alert('Error', 'Server not configured');

      // Optimistically update the UI
      setIsLiked(!isLiked);
      setFavouritesCount((prev) => (isLiked ? prev - 1 : prev + 1));

      if (!isLiked) {
        await ApiService.favourite(server, post.id);
      } else {
        await ApiService.unfavourite(server, post.id);
      }

      onLike && onLike(post);
    } catch (error) {
      // Revert UI changes if API call fails
      setIsLiked(!isLiked);
      setFavouritesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      Alert.alert('Error', 'Failed to like/unlike the post');
    }
  };

  const handleRepost = async () => {
    try {
      if (!server) return Alert.alert('Error', 'Server not configured');

      // Optimistically update the UI
      setIsReposted(!isReposted);
      setReblogsCount((prev) => (isReposted ? prev - 1 : prev + 1));

      if (!isReposted) {
        await ApiService.reblog(server, post.id);
      } else {
        await ApiService.unreblog(server, post.id);
      }

      onRepost && onRepost(post);
    } catch (error) {
      // Revert UI changes if API call fails
      setIsReposted(!isReposted);
      setReblogsCount((prev) => (isReposted ? prev + 1 : prev - 1));
      Alert.alert('Error', 'Failed to repost/un-repost the post');
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.small,
    },
    display_name: {
      fontWeight: 'bold',
      fontSize: theme.spacing.medium,
      color: theme.colors.text,
    },
    username: {
      color: theme.colors.text,
    },
    fediverseId: {
      fontStyle: 'italic',
      color: theme.colors.text,
    },
    date: {
      color: theme.colors.text,
      fontSize: 12,
      marginTop: theme.spacing.small,
    },
    media: {
      marginTop: theme.spacing.medium,
    },
    poll: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.small,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.small,
      marginBottom: theme.spacing.small,
    },
    pollOption: {
      marginBottom: theme.spacing.small,
      color: theme.colors.text,
    },
    counter: {
      marginTop: theme.spacing.medium,
      color: theme.colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.small,
    },
    actionButton: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    likedButton: {
      backgroundColor: theme.colors.primary,
      //borderColor: theme.colors.primary,
    },
    repostedButton: {
      backgroundColor: theme.colors.primary,
    },
    actionButtonText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
  });

  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  const systemFonts = [...defaultSystemFonts];

  const tagsStyles: Record<string, MixedStyleDeclaration> = {
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

  const renderMediaAttachments = () =>
    post.media_attachments.map((media) => (
      <Image
        key={media.id}
        source={{ uri: media.preview_url }}
        style={{ width: '100%', height: 200, marginTop: theme.spacing.small }}
      />
    ));

  const renderPoll = () => (
    <View style={styles.poll}>
      {post.poll?.options.map((option, index) => (
        <Text key={index} style={styles.pollOption}>
          {option.title} ({option.votes_count} votes)
        </Text>
      ))}
    </View>
  );

  const renderBoost = () => (post.reblog ? <PostCard post={post.reblog} /> : null);

  const formattedDate = format(new Date(post.created_at), 'PPPpp');

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ uri: post.account.avatar }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.display_name}>{post.account?.display_name || 'Unknown User'}</Text>
          <Text style={styles.username}>
            @{post.account.username} <Text style={styles.fediverseId}>({post.account.username}@{post.account.domain || 'unknown'})</Text>
          </Text>
        </View>
      </View>

      {/* Render HTML content */}
      <RenderHTML
        contentWidth={width}
        source={{ html: post.content }}
        systemFonts={systemFonts}
        tagsStyles={tagsStyles}
        renderersProps={renderersProps}
        defaultTextProps={{
          selectable: true,
        }}
        enableExperimentalMarginCollapsing={true}
      />

      {/* Media Attachments */}
      {post.media_attachments.length > 0 && <View style={styles.media}>{renderMediaAttachments()}</View>}

      {/* Poll Section */}
      {post.poll && renderPoll()}

      {/* Boosted Post */}
      {renderBoost()}

      {/* Counters */}
      <Text style={styles.counter}>
        ❤️ {favouritesCount} 🔄 {reblogsCount} 💬 {post.replies_count || 0}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, isLiked && styles.likedButton]}
          onPress={handleLike}
        >
          <Text style={styles.actionButtonText}>{isLiked ? 'Unlike' : 'Like'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isReposted && styles.repostedButton]}
          onPress={handleRepost}
        >
          <Text style={styles.actionButtonText}>{isReposted ? 'Undo Repost' : 'Repost'}</Text>
        </TouchableOpacity>
      </View>

      {/* Date */}
      <Text style={styles.date}>Posted on {formattedDate}</Text>
    </View>
  );
};
