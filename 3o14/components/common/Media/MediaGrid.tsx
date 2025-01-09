import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaAttachment } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';

interface MediaGridProps {
  mediaAttachments: MediaAttachment[];
  onMediaPress: (index: number) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaAttachments,
  onMediaPress,
}) => {
  const theme = useTheme();
  const SPACING = 4; // Increased spacing for better aesthetics

  const getItemStyle = (count: number, index: number) => {
    if (count === 1) {
      return styles.singleMedia;
    } else if (count === 2) {
      return styles.twoMedia;
    } else if (count === 3) {
      return index === 0 ? styles.threeMediaFirst : styles.threeMedia;
    } else {
      return styles.fourMedia;
    }
  };

  const renderMediaItem = (item: MediaAttachment, index: number) => {
    const isVideo = item.type === 'video' || item.type === 'gifv';
    const isAudio = item.type === 'audio';
    const placeholder = theme.colors.border || '#ccc';

    return (
      <TouchableOpacity
        key={item.id}
        style={[getItemStyle(mediaAttachments.length, index), { margin: SPACING / 2 }]}
        onPress={() => onMediaPress(index)}
        accessibilityLabel={`Media item ${index + 1}`}
      >
        <Image
          source={{ uri: item.preview_url || placeholder }}
          style={styles.mediaPreview}
          resizeMode="cover"
        />
        {isVideo && (
          <View style={styles.playButton}>
            <Ionicons name="play-circle" size={32} color="#fff" />
          </View>
        )}
        {isAudio && (
          <View style={styles.audioIcon}>
            <Ionicons name="musical-notes" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.mediaGrid, { margin: -SPACING / 2 }]}>
      {mediaAttachments.slice(0, 4).map((item, index) =>
        renderMediaItem(item, index)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-evenly',
  },
  singleMedia: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  twoMedia: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  threeMediaFirst: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  threeMedia: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  fourMedia: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  mediaPreview: {
    flex: 1,
    backgroundColor: '#ccc',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  audioIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
});
