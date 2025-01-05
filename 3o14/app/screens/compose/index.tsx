import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Alert,
  Text,
  Image,
  useWindowDimensions
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Post, CreatePostParams, MediaUploadResponse } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import RenderHTML, { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';

// @ts-ignore
import MathJax from 'react-native-mathjax';
import { MathJaxContext, MathJax as WebMathJax } from 'better-react-mathjax';

interface ContentRendererProps {
  content: string;
  width: number;
  tagsStyles: Record<string, MixedStyleDeclaration>;
  renderersProps: any;
  systemFonts: string[];
}

const mathJaxConfig = {
  loader: {
    load: ['input/tex', 'output/chtml'],
    timeout: 10000,
  },
  startup: {
    typeset: false,
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
};

const mmlOptions = {
  messageStyle: "none",
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  TeX: {
    extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"],
  },
};

declare global {
  interface Window {
    MathJax?: {
      startup?: {
        promise: Promise<void>;
      };
    };
  }
}

const WebContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  width,
  tagsStyles,
  renderersProps,
  systemFonts,
}) => {
  const [mathReady, setMathReady] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Wait for MathJax to be ready before rendering content
    const checkMathJax = async () => {
      try {
        await window.MathJax?.startup?.promise;
        setMathReady(true);
        setKey((prev) => prev + 1); // Trigger re-render when MathJax is ready
      } catch (error) {
        console.error("MathJax failed to initialize", error);
      }
    };
    checkMathJax();
  }, []);

  const handleMathJaxError = (error: any) => {
    console.error('MathJax typesetting error:', error);
  };

  // Prevent rendering if MathJax isn't ready or content is missing
  if (!mathReady || !content) {
    return <ActivityIndicator size="small" />;
  }

  return (
    <MathJaxContext key={key} config={mathJaxConfig}>
      <WebMathJax onError={handleMathJaxError}>
        <RenderHTML
          contentWidth={width}
          source={{ html: content }}
          systemFonts={systemFonts}
          tagsStyles={tagsStyles}
          renderersProps={renderersProps}
          defaultTextProps={{
            selectable: true,
          }}
          enableExperimentalMarginCollapsing={true}
        />
      </WebMathJax>
    </MathJaxContext>
  );
};

const NativeContentRenderer: React.FC<ContentRendererProps> = ({
  content,
}) => {
  const theme = useTheme();

  const mathJaxStyle = `
    <style>
      body {
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
      }
      .MathJax {
        display: inline-block;
        font-size: 1rem;
        line-height: 1.5;
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
      }
      a {
        color: ${theme.colors.primary};
      }
    </style>
  `;

  return (
    <MathJax
      mathJaxOptions={mmlOptions}
      html={`${mathJaxStyle}${content}`}
    />
  );
};

const ContentRenderer: React.FC<ContentRendererProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebContentRenderer {...props} />
    : <NativeContentRenderer {...props} />;
};

type VisibilityType = 'public' | 'unlisted' | 'private' | 'direct';

interface Visibility {
  type: VisibilityType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ComposeRouteParams {
  replyToId?: string;
  replyToPost?: string;
}

const VISIBILITY_OPTIONS: Visibility[] = [
  { type: 'public', label: 'Public', icon: 'globe' },
  { type: 'unlisted', label: 'Unlisted', icon: 'people' },
  { type: 'private', label: 'Followers', icon: 'lock-closed' },
  { type: 'direct', label: 'Direct', icon: 'mail' },
];

const ReplyPreview: React.FC<{ account: string | undefined }> = ({ account, }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    replyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    replyText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    username: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.replyContainer}>
      <Ionicons
        name="arrow-undo-outline"
        size={16}
        color={theme.colors.text}
        style={{ marginRight: theme.spacing.small }}
      />
      <Text style={styles.replyText}>
        Replying to <Text style={styles.username}>@{account}</Text>
      </Text>
    </View>
  );
};

export default function ComposeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams() as unknown as ComposeRouteParams;

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToPost, setReplyToPost] = useState<Post | null>(null);
  const [mediaAttachments, setMediaAttachments] = useState<MediaUploadResponse[]>([]);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(VISIBILITY_OPTIONS[0]);
  const [isSelectingVisibility, setIsSelectingVisibility] = useState(false);

  useEffect(() => {
    if (params.replyToPost) {
      try {
        const decodedPost = JSON.parse(decodeURIComponent(atob(params.replyToPost)));
        setReplyToPost(decodedPost);
      } catch (error) {
        console.error('Error parsing reply-to post:', error);
      }
    }
  }, [params.replyToPost]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
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
      router.back();
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.medium,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    mediaPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
    },
    mediaPreviewItem: {
      width: 100,
      height: 100,
      borderRadius: theme.borderRadius.medium,
    },
    mediaRemoveButton: {
      position: 'absolute',
      right: -8,
      top: -8,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.small,
      padding: 4,
    },
    visibilityModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.medium,
    },
    visibilityOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    visibilityOptionText: {
      marginLeft: theme.spacing.medium,
      color: theme.colors.text,
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: theme.spacing.small,
      marginRight: theme.spacing.small,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      flexDirection: 'row',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    previewBox: {
      maxHeight: 200, // Limit the height of the preview box
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.medium,
      backgroundColor: theme.colors.background,
    },
  });

  const systemFonts = [...defaultSystemFonts];
  const { width } = useWindowDimensions();

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

  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  const formattedContent = content.replace(/\n/g, '<br>');

  return (
    <>
      <Stack.Screen
        options={{
          title: params.replyToId ? 'Reply' : 'New Post',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 0,
            borderTopWidth: 0,
          } as any,
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.contentContainer}>
          {replyToPost && (
            <ReplyPreview
              account={replyToPost.account.acct}
            />
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
            placeholder={params.replyToId ? "Write your reply..." : "What's on your mind?"}
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

          {mediaAttachments.length > 0 && (
            <View style={styles.mediaPreview}>
              {mediaAttachments.map((media, index) => (
                <View key={media.id}>
                  <Image
                    source={{ uri: media.preview_url }}
                    style={styles.mediaPreviewItem}
                  />
                  <TouchableOpacity
                    style={styles.mediaRemoveButton}
                    onPress={() => {
                      setMediaAttachments(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={pickImage}
              disabled={mediaAttachments.length >= 4}
            >
              <Ionicons
                name="image"
                size={24}
                color={mediaAttachments.length >= 4 ? theme.colors.border : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowContentWarning(!showContentWarning)}
            >
              <Ionicons
                name="warning"
                size={24}
                color={showContentWarning ? theme.colors.primary : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsSelectingVisibility(true)}
            >
              <Ionicons
                name={visibility.icon}
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!content.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.background} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={theme.colors.background} />
            )}
          </TouchableOpacity>
        </View>

        {isSelectingVisibility && (
          <View style={styles.visibilityModal}>
            {VISIBILITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.visibilityOption}
                onPress={() => {
                  setVisibility(option);
                  setIsSelectingVisibility(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={option.type === visibility.type ? theme.colors.primary : theme.colors.text}
                />
                <Text style={styles.visibilityOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
