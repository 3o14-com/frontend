import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { Post } from '@/types/api';
import RenderHTML, { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';
import { format } from 'date-fns';
import { LogBox } from 'react-native';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';

// Ignore specific log notifications
LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer: Support for defaultProps will be removed from function components in a future major release.',
  'Warning: MemoizedTNodeRenderer: Support for defaultProps will be removed from memo components in a future major release.',
  'Warning: TRenderEngineProvider: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

interface PostCardProps {
  post: Post;
  onLike?: (post: Post) => void;
  onReblog?: (post: Post) => void;
  isBoost?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReblog, isBoost = false }) => {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [server, setServer] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(post.favourited || false);
  const [isReblogged, setIsReblogged] = useState(post.reblogged || false);
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

      setIsLiked(!isLiked);
      setFavouritesCount((prev) => (isLiked ? prev - 1 : prev + 1));

      if (!isLiked) {
        await ApiService.favourite(server, post.id);
      } else {
        await ApiService.unfavourite(server, post.id);
      }

      onLike && onLike(post);
    } catch (error) {
      setIsLiked(!isLiked);
      setFavouritesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      Alert.alert('Error', 'Failed to like/unlike the post');
    }
  };

  const handleReblog = async () => {
    try {
      if (!server) return Alert.alert('Error', 'Server not configured');

      setIsReblogged(!isReblogged);
      setReblogsCount((prev) => (isReblogged ? prev - 1 : prev + 1));

      if (!isReblogged) {
        await ApiService.reblog(server, post.id);
      } else {
        await ApiService.unreblog(server, post.id);
      }

      onReblog && onReblog(post);
    } catch (error) {
      setIsReblogged(!isReblogged);
      setReblogsCount((prev) => (isReblogged ? prev + 1 : prev - 1));
      Alert.alert('Error', 'Failed to reblog/un-reblog the post');
    }
  };

  const styles = StyleSheet.create({
    container: {
      ...(isBoost ? {} : {
        padding: theme.spacing.medium,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }),
      backgroundColor: theme.colors.background,
    },
    boostInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    boostText: {
      color: theme.colors.text,
      marginLeft: theme.spacing.small,
      fontSize: 14,
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
      marginTop: theme.spacing.medium,
      textAlign: "right",
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
    actions: {
      flexDirection: 'row',
      marginTop: 12,
      justifyContent: 'space-around',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionText: {
      fontSize: 16,
      marginLeft: 8,
    },
    footerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.medium,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    visibilityIcon: {
      marginRight: theme.spacing.small,
    },
    mediaContainer: {
      marginTop: theme.spacing.medium,
      width: '100%',
      backgroundColor: theme.colors.background,
    },
    image: {
      width: '100%',
      backgroundColor: theme.colors.background,
    },
    pressed: {
      opacity: 0.5,
    }
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

  const calculateImageHeight = (media: any) => {
    const screenWidth = width - (theme.spacing.medium * 2);
    if (media.meta?.original?.width && media.meta?.original?.height) {
      return screenWidth * (media.meta.original.height / media.meta.original.width);
    }
    return screenWidth;
  };

  const renderMediaAttachments = () =>
    post.media_attachments.map((media) => {
      const imageHeight = calculateImageHeight(media);
      return (
        <View key={media.id} style={styles.mediaContainer}>
          <Image
            source={{ uri: media.preview_url }}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="contain"
          />
        </View>
      );
    });

  const renderPoll = () => (
    <View style={styles.poll}>
      {post.poll?.options.map((option, index) => (
        <Text key={index} style={styles.pollOption}>
          {option.title} ({option.votes_count} votes)
        </Text>
      ))}
    </View>
  );

  const formattedDate = format(new Date(post.created_at), 'PPPpp');

  const handlePostPress = () => {
    router.push(`/screens/thread/${post.id}`);
  };

  const renderContent = () => {
    if (post.reblog && !isBoost) {
      return (
        <>
          <View style={styles.boostInfo}>
            <Ionicons name="repeat" size={16} color={theme.colors.text} />
            <Text style={styles.boostText}>{post.account.display_name} boosted</Text>
          </View>
          <PostCard post={post.reblog} isBoost={true} onLike={onLike} onReblog={onReblog} />
        </>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Image
            source={{ uri: post.account.avatar }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.display_name}>{post.account?.display_name || 'Unknown User'}</Text>
            <Text style={styles.username}>
              @{post.account.username} <Text style={styles.fediverseId}>({post.account.acct})</Text>
            </Text>
          </View>
        </View>

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

        {post.media_attachments.length > 0 && <View style={styles.media}>{renderMediaAttachments()}</View>}

        {post.poll && renderPoll()}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? theme.colors.error : theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{favouritesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReblog}>
            <Ionicons name={isReblogged ? 'repeat' : 'repeat-outline'} size={24} color={isReblogged ? theme.colors.success : theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{reblogsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name={'return-down-back-outline'} size={24} color={theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{post.replies_count}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>Posted on {formattedDate}</Text>
      </>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={handlePostPress}
    >
      {renderContent()}
    </Pressable>
  );
};
