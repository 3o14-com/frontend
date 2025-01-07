import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { MediaUploadResponse } from '@/types/api';

interface MediaPreviewProps {
  attachments: MediaUploadResponse[];
  onRemove: (index: number) => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  attachments,
  onRemove,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
    },
    previewItem: {
      width: 100,
      height: 100,
      borderRadius: theme.borderRadius.medium,
    },
    removeButton: {
      position: 'absolute',
      right: -8,
      top: -8,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.small,
      padding: 4,
    },
  });

  if (attachments.length === 0) return null;

  return (
    <View style={styles.container}>
      {attachments.map((media, index) => (
        <View key={media.id}>
          <Image
            source={{ uri: media.preview_url }}
            style={styles.previewItem}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
