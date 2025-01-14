import React, { memo, useMemo, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaAttachment } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';

interface MediaGridProps {
  mediaAttachments: MediaAttachment[];
  onMediaPress: (index: number) => void;
}

const SPACING = 4;

const MediaIcon = memo(({ type }: { type: string }) => {
  const theme = useTheme();
  const isVideo = type === 'video' || type === 'gifv';
  const isAudio = type === 'audio';

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
});

MediaIcon.displayName = 'MediaIcon';

const MediaItem = memo(({
  item,
  index,
  imageCount,
  onPress,
  getMediaStyle
}: {
  item: MediaAttachment;
  index: number;
  imageCount: number;
  onPress: (index: number) => void;
  getMediaStyle: (count: number, index: number) => any;
}) => {
  const theme = useTheme();
  const placeholder = theme.colors.border || '#ccc';

  const handlePress = useCallback(() => {
    onPress(index);
  }, [index, onPress]);

  const itemStyle = useMemo(() => [
    styles.mediaItem,
    getMediaStyle(imageCount, index),
    imageCount >= 2 && imageCount <= 4 && {
      borderRadius: 12,
    },
  ], [imageCount, index, getMediaStyle]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={itemStyle}
      accessibilityLabel={`Media item ${index + 1}`}
    >
      <Image
        source={{ uri: item.preview_url || placeholder }}
        style={styles.image}
        resizeMode="cover"
      />
      <MediaIcon type={item.type} />
    </TouchableOpacity>
  );
});

MediaItem.displayName = 'MediaItem';

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

export const MediaGrid = memo(({ mediaAttachments, onMediaPress }: MediaGridProps) => {
  const imageCount = Math.min(mediaAttachments.length, 4);

  const getMediaStyle = useCallback((count: number, index: number) => {
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
  }, []);

  const getContainerStyle = useCallback((count: number) => {
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
  }, []);

  const containerStyle = useMemo(() => [
    styles.container,
    getContainerStyle(imageCount),
    imageCount === 2 && { borderRadius: 0 }
  ], [imageCount, getContainerStyle]);

  return (
    <View style={containerStyle}>
      {mediaAttachments.slice(0, 4).map((item, index) => (
        <MediaItem
          key={item.id}
          item={item}
          index={index}
          imageCount={imageCount}
          onPress={onMediaPress}
          getMediaStyle={getMediaStyle}
        />
      ))}
    </View>
  );
});

MediaGrid.displayName = 'MediaGrid';
