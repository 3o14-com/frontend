import React, { useState, useEffect } from 'react';
import { Modal, Share, Linking, Platform, View, Text, StyleSheet, Image, useWindowDimensions, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { Post } from '@/types/api';
import { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';
import { format } from 'date-fns';
import { LogBox } from 'react-native';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import Confirm from '@/components/common/Confirm';
import { ContentRenderer } from '@/components/common/ContentRenderer';


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

  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await StorageService.get('userID');
      setCurrentUserId(userId);
    };
    fetchUserId();
  }, []);

  const handleShare = async () => {
    try {
      if (!server) return;
      const postUrl = `https://${server}/web/statuses/${post.id}`;

      if (Platform.OS === 'web') {
        // Copy link to clipboard for web
        navigator.clipboard.writeText(postUrl);
      } else {
        // Share post for non-web platforms
        await Share.share({
          message: postUrl,
        });
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleDelete = async () => {
    if (!server) {
      Alert.alert('Error', 'Server not configured');
      return;
    }

    if (!post?.id || typeof post.id !== 'string') {
      Alert.alert('Error', 'Invalid post ID');
      return;
    }

    if (currentUserId !== post.account.id) return;

    setShowConfirm(true);
  };

  const deletePost = async () => {
    if (!server || !post.id) {
      Alert.alert('Error', 'Server or post ID is missing');
      return;
    }

    try {
      await ApiService.deletePost(server, post.id);
      Alert.alert('Success', 'Post deleted successfully');
      setShowModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete post');
    } finally {
      setShowConfirm(false);
    }
  };

  const handleOpenOriginal = async () => {
    if (!server) return;
    const postUrl = `https://${server}/web/statuses/${post.id}`;
    try {
      await Linking.openURL(postUrl);
      setShowModal(false);
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open link');
    }
  };

  const modalStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: theme.spacing.small,
      width: Platform.OS === 'web' ? 300 : '80%',
      maxWidth: 400,
      ...Platform.select({
        web: {
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        default: {
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
      }),
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      borderRadius: 8,
    },
    optionText: {
      color: theme.colors.text,
      fontSize: 14,
      marginLeft: theme.spacing.medium,
      flex: 1,
    },
    deleteOption: {
      backgroundColor: `${theme.colors.error}10`,
    },
    deleteText: {
      color: theme.colors.error,
    },
  });

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <Pressable
        style={modalStyles.modalOverlay}
        onPress={() => setShowModal(false)}
      >
        <Pressable
          style={modalStyles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >

          <Pressable
            style={modalStyles.option}
            onPress={handleShare}
          >
            <Ionicons
              name={Platform.OS === 'web' ? "copy-outline" : "share-outline"}
              size={24}
              color={theme.colors.text}
            />
            <Text style={modalStyles.optionText}>
              {Platform.OS === 'web' ? 'Copy Link' : 'Share Post'}
            </Text>
          </Pressable>

          <Pressable
            style={modalStyles.option}
            onPress={handleOpenOriginal}
          >
            <Ionicons name="open-outline" size={24} color={theme.colors.text} />
            <Text style={modalStyles.optionText}>Open Original</Text>
          </Pressable>
          {
            currentUserId === post.account.id && (
              <>
                <Pressable
                  style={[modalStyles.option, modalStyles.deleteOption]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                  <Text style={[modalStyles.optionText, modalStyles.deleteText]}>Delete Post</Text>
                </Pressable>

                {/* Confirm Modal */}
                <Confirm
                  visible={showConfirm}
                  message="Are you sure you want to delete this post?"
                  options={[
                    {
                      text: 'Cancel',
                      onPress: () => setShowConfirm(false),
                      style: { backgroundColor: theme.colors.background },
                    },
                    {
                      text: 'Delete',
                      onPress: deletePost,
                      style: { backgroundColor: theme.colors.error },
                    },
                  ]}
                  onClose={() => setShowConfirm(false)}
                />
              </>
            )}
        </Pressable>
      </Pressable>
    </Modal>
  );

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
      paddingRight: 15,
    },
    media: {
      paddingLeft: 50,
      paddingRight: 15,
    },
    poll: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.small,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.small,
      marginBottom: theme.spacing.small,
      paddingLeft: 50,
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
      justifyContent: 'space-between',
      paddingLeft: 50,
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rightActions: {
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 15,
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
      opacity: 1,
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
      paddingLeft: 50,
      paddingRight: 15,
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

  const handleProfilePress = () => {
    try {
      const username = post.account.acct

      if (!username) {
        console.error('Could not determine username for profile navigation');
        return;
      }

      router.push(`/screens/profile/${username}`);
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  const handleReply = () => {
    try {
      if (!post?.id) {
        console.error('Invalid post data for reply: missing post ID');
        return;
      }

      const encodedPost = btoa(encodeURIComponent(JSON.stringify(post)));

      router.push({
        pathname: '/screens/compose',
        params: {
          replyToId: post.id,
          replyToPost: encodedPost
        }
      });
    } catch (error) {
      console.error('Error navigating to reply compose:', error);
    }
  };

  const formatContent = (content: string): string => {
    content = content.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) => {
      // Convert LaTeX content inside \( \) to plain text
      return `\\(${latex.replace(/<[^>]*>/g, '')}\\)`;  // Optionally, remove any HTML tags inside LaTeX
    });

    content = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => {
      // Convert LaTeX content inside \[ \] to plain text
      return `\\[${latex.replace(/<[^>]*>/g, '')}\\]`; // Optionally, remove any HTML tags inside LaTeX
    });

    // Then, replace newlines outside LaTeX sections with <br>
    return content.replace(/(\n)/g, (_) => {
      return '<br>';
    });
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
        <Pressable
          onPress={handleProfilePress}
        >
          <View style={styles.header}>
            <Image
              source={{ uri: post.account.avatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.display_name}>{post.account?.display_name || 'Unknown User'}</Text>
              <Text style={styles.username}>
                <Text style={styles.fediverseId}>@{post.account.acct}</Text>
              </Text>
            </View>
          </View>
        </Pressable>

        <ContentRenderer
          content={formatContent(post.content)}
          width={width}
          tagsStyles={tagsStyles}
          renderersProps={renderersProps}
          systemFonts={systemFonts}
        />

        {post.media_attachments.length > 0 && <View style={styles.media}>{renderMediaAttachments()}</View>}

        {post.poll && renderPoll()}

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? theme.colors.error : theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>{favouritesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReblog}>
              <Ionicons name={isReblogged ? 'repeat' : 'repeat-outline'} size={20} color={isReblogged ? theme.colors.success : theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>{reblogsCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <Ionicons name={'return-down-back-outline'} size={20} color={theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>{post.replies_count}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name={'ellipsis-horizontal'} size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          {renderModal()}
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
