import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { defaultSystemFonts } from 'react-native-render-html';
import { useTheme } from '@/hooks/useTheme';
import { ApiService } from '@/services/api';
import { ContentRenderer } from '../ContentRenderer';
import { ComposeToolbar } from './ComposeToolbar';
import { ReplyPreview } from './ReplyPreview';
import { VisibilitySelector } from './VisibilitySelector';
import { MediaPreview } from './MediaPreview';
import type { ComposeProps, Visibility } from './types';
import type { CreatePostParams, MediaUploadResponse } from '@/types/api';
import { StorageService } from '@/services/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';


const VISIBILITY_OPTIONS: Visibility[] = [
  { type: 'public', label: 'Public', icon: 'globe' },
  { type: 'unlisted', label: 'Unlisted', icon: 'people' },
  { type: 'private', label: 'Followers', icon: 'lock-closed' },
  { type: 'direct', label: 'Direct', icon: 'mail' },
];

interface ComposeRouteParams {
  replyToId?: string;
  replyToPost?: string;
}

export const ComposeComponent: React.FC<ComposeProps> = ({
  initialContent = '',
  replyToPost,
  onSubmit,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaAttachments, setMediaAttachments] = useState<MediaUploadResponse[]>([]);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(VISIBILITY_OPTIONS[0]);
  const [isSelectingVisibility, setIsSelectingVisibility] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams() as unknown as ComposeRouteParams;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
      textAlignVertical: 'top',
      minHeight: 150,
      borderWidth: 0,
      padding: theme.spacing.medium,
    },
    warningInput: {
      color: theme.colors.text,
      fontSize: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: theme.spacing.small,
      marginBottom: theme.spacing.medium,
      marginHorizontal: theme.spacing.medium,
    },
    previewBox: {
      maxHeight: 200,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.medium,
      backgroundColor: theme.colors.background,
    },
  });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as const,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const server = await StorageService.get('server');
        if (!server) throw new Error('Server not configured');

        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        } as any);

        const uploadedMedia = await ApiService.uploadMedia(server, formData);
        setMediaAttachments(prev => [...prev, uploadedMedia]);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload media');
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const postParams: CreatePostParams = {
        status: content,
        in_reply_to_id: params.replyToId,
        media_ids: mediaAttachments.map(m => m.id),
        sensitive: showContentWarning,
        spoiler_text: showContentWarning ? contentWarning : undefined,
        visibility: visibility.type,
      };

      await ApiService.createPost(server, postParams);
      // Instead of calling router.back() directly, call the onSubmit callback
      onSubmit();
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedContent = content.replace(/\n/g, '<br>');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView style={styles.contentContainer}>
        {replyToPost && (
          <ReplyPreview account={replyToPost.account.acct} />
        )}

        {showContentWarning && (
          <TextInput
            placeholder="Content warning"
            value={contentWarning}
            onChangeText={setContentWarning}
            style={[
              styles.warningInput,
              Platform.OS === 'web' && { outline: 'none' },
            ]}
            placeholderTextColor={theme.colors.border}
          />
        )}

        <TextInput
          multiline
          placeholder={replyToPost ? "Write your reply..." : "What's on your mind?"}
          value={content}
          onChangeText={setContent}
          style={[
            styles.input,
            Platform.OS === 'web' && { outline: 'none' },
          ]}
          placeholderTextColor={theme.colors.border}
          autoFocus
        />

        <View style={styles.previewBox}>
          <ScrollView>
            <ContentRenderer
              content={formattedContent}
              width={width}
              tagsStyles={tagsStyles}
              renderersProps={renderersProps}
              systemFonts={systemFonts}
            />
          </ScrollView>
        </View>

        <MediaPreview
          attachments={mediaAttachments}
          onRemove={(index) => {
            setMediaAttachments(prev => prev.filter((_, i) => i !== index));
          }}
        />
      </ScrollView>

      <ComposeToolbar
        onPickImage={pickImage}
        onToggleContentWarning={() => setShowContentWarning(!showContentWarning)}
        onSelectVisibility={() => setIsSelectingVisibility(true)}
        onSubmit={handleSubmit}
        showContentWarning={showContentWarning}
        visibility={visibility}
        isSubmitting={isSubmitting}
        hasContent={!!content.trim()}
        mediaCount={mediaAttachments.length}
        theme={theme}
      />

      <VisibilitySelector
        visible={isSelectingVisibility}
        options={VISIBILITY_OPTIONS}
        selectedVisibility={visibility}
        onSelect={(option) => {
          setVisibility(option);
          setIsSelectingVisibility(false);
        }}
        theme={theme}
      />
    </KeyboardAvoidingView>
  );
}; 