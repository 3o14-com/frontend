import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/types/api';
import RenderHTML from 'react-native-render-html';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.background,
    },
    display_name: {
      fontWeight: 'bold',
      fontSize: theme.spacing.medium,
      marginBottom: theme.spacing.small,
      color: theme.colors.text,
    },
    username: {
      fontStyle: 'italic',
      marginBottom: theme.spacing.small,
      color: theme.colors.text,
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
      color: theme.colors.text,
    },
  });

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

  const renderBoost = () =>
    post.reblog ? (
      <PostCard post={post.reblog} />
    ) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.display_name}>{post.account.display_name}</Text>
      <Text style={styles.username}>@{post.account.username}</Text>
      <RenderHTML
        source={{ html: post.content }}
        tagsStyles={{
          a: { color: theme.colors.primary },
          p: { color: theme.colors.text },
        }}
      />
      {post.media_attachments.length > 0 && <View style={styles.media}>{renderMediaAttachments()}</View>}
      {post.poll && renderPoll()}
      {renderBoost()}
      <Text style={styles.counter}>❤️ {post.favourites_count} 🔄 {post.reblogs_count} 💬 {post.replies_count}</Text>
    </View>
  );
};
