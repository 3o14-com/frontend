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
import { MediaGrid } from '@/components/common/Media/MediaGrid';
import { MediaViewer } from '@/components/common/Media/MediaViewer';
import { useAuth } from '@/hooks/useAuth';
import { PollComponent } from '@/components/common/PollComponent';

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
  const { user } = useAuth();

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
      console.log('Post deleted successfully');
      setShowModal(false);
    } catch (error) {
      console.log('Error deleting post:', error);
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
                  message="Delete this post?"
                  extraMessage="Changes will show up after you refresh."
                  options={[
                    {
                      text: 'Cancel',
                      onPress: () => { setShowConfirm(false); setShowModal(false) },
                      icon: 'close-outline'
                    },
                    {
                      text: 'Delete',
                      onPress: deletePost,
                      destructive: true,
                      icon: 'trash-outline'
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
        borderBottomWidth: 0,
      }),
      backgroundColor: theme.colors.background,
    },
    boostInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    boostText: {
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
    },
    media: {
      paddingLeft: 50,
      paddingRight: 15,
    },
    pollContainer: {
      paddingLeft: 40,
      paddingRight: 10,
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
      justifyContent: 'flex-end',
      marginTop: theme.spacing.medium,
      paddingRight: 15,
    },
    visibilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    visibilityText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginRight: theme.spacing.small,
    },
    dot: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginHorizontal: theme.spacing.small,
    },
    date: {
      color: theme.colors.textSecondary,
      fontSize: 12,
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
    renderedContent: {
      paddingLeft: 40,
    },
    replyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    replyText: {
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.small,
      fontSize: 14,
    },
    accentText: {
      color: theme.colors.primary,
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
      paddingLeft: 8,
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

  type IconName = keyof typeof Ionicons.glyphMap;

  const getVisibilityInfo = (visibility: string): { icon: IconName } => {
    switch (visibility) {
      case 'direct':
        return {
          icon: 'mail' as IconName,
        };
      case 'private':
        return {
          icon: 'lock-closed' as IconName,
        };
      case 'unlisted':
        return {
          icon: 'eye-off' as IconName,
        };
      case 'public':
      default:
        return {
          icon: 'globe' as IconName,
        };
    }
  };

  const renderMedia = () => {
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(-1);

    if (!post.media_attachments?.length) return null;

    return (
      <View style={styles.mediaContainer}>
        <MediaGrid
          mediaAttachments={post.media_attachments}
          onMediaPress={(index) => setSelectedMediaIndex(index)}
        />
        <MediaViewer
          visible={selectedMediaIndex !== -1}
          mediaItems={post.media_attachments}
          initialIndex={selectedMediaIndex}
          onClose={() => setSelectedMediaIndex(-1)}
        />
      </View>
    );
  };

  const renderPoll = () => {
    if (!post.poll) return null;
    const isOwnPoll = post.account.id === currentUserId;
    const hasVoted = post.poll.voted || false;

    return (
      <PollComponent
        poll={post.poll}
        onVote={handlePollVote}
        isOwnPoll={isOwnPoll}
        voted={hasVoted}
      />
    );
  };

  const handlePollVote = async (choices: number[]) => {
    try {
      if (!server || !post.poll) return;

      const updatedPoll = await ApiService.votePoll(server, post.poll.id, choices);

      // Update local state with the response from server
      post.poll = updatedPoll;

    } catch (error) {
      console.error('Error voting in poll:', error);
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const formattedDate = format(new Date(post.created_at), 'PPPpp');

  const handlePostPress = () => {
    router.push(`/(modals)/${post.id}`);
  };

  const handleProfilePress = () => {
    try {
      if (!user) {
        console.error('No logged-in user found.');
        return;
      }

      const username = post.account.acct;

      if (user.username === username) {
        router.push(`/(tabs)/profile`);
      } else {
        router.push(`/(modals)/(profile)/${username}`);
      }
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
        pathname: '/(modals)/compose',
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

  const handleProfileNavigation = (acct: string | unknown) => {
    if (typeof acct === 'string') {
      router.push(`/(modals)/(profile)/${acct}`);
    } else {
      console.error("Account ID is not a string:", acct);
    }
  };

  const handleReplyToPress = () => {
    if (post.in_reply_to_id && post.in_reply_to_account_id) {
      router.push(`/(modals)/${post.in_reply_to_id}`);
    }
  };

  const renderContent = () => {
    if (post.reblog && !isBoost) {
      const isThreadedReply = post.reblog.in_reply_to_id;

      return (
        <>
          <TouchableOpacity
            onPress={() => handleProfileNavigation(post.account.acct)}
          >
            <View style={styles.boostInfo}>
              <Ionicons name="repeat" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.boostText}>
                <Text style={styles.accentText}>{post.account.display_name}</Text>
                {isThreadedReply ? ' Boosted a Thread ' : ' Boosted'}
              </Text>
              {isThreadedReply && (
                <Ionicons
                  name="git-branch-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              )}
            </View>
          </TouchableOpacity>
          <PostCard
            post={post.reblog}
            isBoost={true}
            onLike={onLike}
            onReblog={onReblog}
          />
        </>
      );
    }

    return (
      <>
        {post.in_reply_to_id && !isBoost && (
          <TouchableOpacity
            onPress={handleReplyToPress}
            style={styles.replyInfo}
          >
            <Ionicons
              name="git-branch-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.replyText}>
              Threaded Reply
            </Text>
          </TouchableOpacity>
        )}
        <Pressable onPress={handleProfilePress}>
          <View style={styles.header}>
            <Image
              source={{ uri: post.account.avatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.display_name}>
                {post.account?.display_name || post.account?.username}
              </Text>
              <Text style={styles.username}>
                <Text style={styles.fediverseId}>@{post.account.acct}</Text>
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.renderedContent}>
          <ContentRenderer
            content={formatContent(post.content)}
            width={width}
            tagsStyles={tagsStyles}
            renderersProps={renderersProps}
            systemFonts={systemFonts}
          />
        </View>

        <View style={styles.media}>
          {post.media_attachments.length > 0 && renderMedia()}
        </View>

        <View style={styles.pollContainer}>
          {post.poll && renderPoll()}
        </View>

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? theme.colors.error : theme.colors.text}
              />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {favouritesCount}
              </Text>
            </TouchableOpacity>
            {post.visibility === 'public' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReblog}
              >
                <Ionicons
                  name={isReblogged ? 'repeat' : 'repeat-outline'}
                  size={20}
                  color={isReblogged ? theme.colors.success : theme.colors.text}
                />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {reblogsCount}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <Ionicons
                name={'return-down-back-outline'}
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {post.replies_count}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons
                name={'ellipsis-horizontal'}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          {renderModal()}
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.visibilityContainer}>
            {post.visibility && (
              <>
                <Ionicons
                  name={getVisibilityInfo(post.visibility).icon}
                  size={12}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.dot}>•</Text>
              </>
            )}
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePostPress}
    >
      {renderContent()}
    </Pressable>
  );
};
