import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaAttachment } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';

interface MediaGridProps {
  mediaAttachments: MediaAttachment[];
  onMediaPress: (index: number) => void;
}

const renderMediaIcon = (type: string) => {
  const isVideo = type === 'video' || type === 'gifv';
  const isAudio = type === 'audio';
  const theme = useTheme();


  const styles = StyleSheet.create({
    iconContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [
        { translateX: -16 },
        { translateY: -16 },
      ],
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  if (isVideo) {
    return (
      <View style={styles.iconContainer}>
        <Ionicons name="play-circle" size={32} color={String(theme.colors.border)} />
      </View>
    );
  }

  if (isAudio) {
    return (
      <View style={styles.iconContainer}>
        <Ionicons name="musical-notes" size={24} color="#fff" />
      </View>
    );
  }

  return null;
};

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaAttachments,
  onMediaPress,
}) => {
  const theme = useTheme();
  const imageCount = Math.min(mediaAttachments.length, 4);


  const MediaItem = ({ item, index }: { item: MediaAttachment; index: number }) => {
    const placeholder = theme.colors.border || '#ccc';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onMediaPress(index)}
        style={[
          styles.mediaItem,
          getMediaStyle(imageCount, index),
          imageCount === 4 && {
            borderRadius: 12,
          },
          imageCount === 3 && {
            borderRadius: 12,
          },
          imageCount === 2 && {
            borderRadius: 12,
          },
        ]}
        accessibilityLabel={`Media item ${index + 1}`}
      >
        <Image
          source={{ uri: item.preview_url || placeholder }}
          style={styles.image}
          resizeMode="cover"
        />
        {renderMediaIcon(item.type)}
      </TouchableOpacity>
    );
  };

  const getMediaStyle = (count: number, index: number) => {
    switch (count) {
      case 1:
        return styles.fullWidth;
      case 2:
        return styles.halfWidth;
      case 3:
        return index === 0 ? styles.fullWidth : styles.halfWidth;
      case 4:
        return styles.halfWidth;

      default:
        return styles.halfWidth;
    }
  };

  const getContainerStyle = (count: number) => {
    switch (count) {
      case 1:
        return styles.singleContainer;
      case 2:
        return styles.doubleContainer;
      case 3:
        return styles.tripleContainer;
      case 4:

      default:
        return styles.tripleContainer;
    }
  };

  const SPACING = 4;

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: 12,
    },
    singleContainer: {
      aspectRatio: 16 / 9,
    },
    doubleContainer: {
      flexDirection: 'row',
      gap: SPACING,
      aspectRatio: 16 / 9,
    },
    tripleContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING,
    },
    mediaItem: {
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
    },
    fullWidth: {
      width: '100%',
      aspectRatio: 16 / 9,
    },
    halfWidth: {
      flex: 1,
      minWidth: '49%',
      aspectRatio: 1,
    },
    image: {
      width: '100%',
      height: '100%',
      backgroundColor: '#ccc',
    },
  });

  return (
    <View style={[
      styles.container,
      getContainerStyle(imageCount),
      // Remove border radius from container for two-image layout
      imageCount === 2 && { borderRadius: 0 }
    ]}>
      {mediaAttachments.slice(0, 4).map((item, index) => (
        <MediaItem key={item.id} item={item} index={index} />
      ))}
    </View>
  );
};

