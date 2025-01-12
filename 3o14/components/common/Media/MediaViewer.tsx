import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useVideoPlayer, VideoView, VideoPlayer } from 'expo-video';
import Carousel from 'react-native-reanimated-carousel';
import { MediaAttachment } from '@/types/api';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface MediaViewerProps {
  visible: boolean;
  mediaItems: MediaAttachment[];
  initialIndex: number;
  onClose: () => void;
}

const MediaImage = memo(({ uri, width, height }: { uri: string; width: number; height: number }) => (
  <Image
    source={{ uri }}
    style={{
      width,
      height,
    }}
    resizeMode="contain"
  />
));

const MediaVideo = memo(({ uri, width, height, isGifv }: { uri: string; width: number; height: number; isGifv: boolean }) => {
  const player = useVideoPlayer(uri, useCallback((player: VideoPlayer) => {
    player.loop = isGifv;
    player.play();
  }, [isGifv]));

  return (
    <VideoView
      style={{
        width,
        height,
      }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
});

const MediaAudio = memo(({ uri, previewUri, width }: { uri: string; previewUri: string; width: number }) => {
  const player = useVideoPlayer(uri, useCallback((player: VideoPlayer) => {
    player.loop = false;
  }, []));

  const audioStyle = Platform.OS === 'web' ? { width: width * 0.6 } : { width: width * 0.8 };

  return (
    <View style={styles.audioContainer}>
      <VideoView
        style={audioStyle}
        player={player}
        allowsFullscreen={false}
      />
      <Image
        source={{ uri: previewUri }}
        style={styles.audioPreview}
      />
    </View>
  );
});

const CarouselRenderItem = memo(({ item, mediaWidth, mediaHeight }: {
  item: MediaAttachment;
  mediaWidth: number;
  mediaHeight: number;
}) => (
  <View style={styles.mediaWrapper}>
    <View style={styles.mediaContainer}>
      {item.type === 'video' || item.type === 'gifv' ? (
        <MediaVideo
          uri={item.url}
          width={mediaWidth}
          height={mediaHeight}
          isGifv={item.type === 'gifv'}
        />
      ) : item.type === 'audio' ? (
        <MediaAudio
          uri={item.url}
          previewUri={item.preview_url}
          width={mediaWidth}
        />
      ) : (
        <MediaImage
          uri={item.url}
          width={mediaWidth}
          height={mediaHeight}
        />
      )}
    </View>
  </View>
));

export const MediaViewer: React.FC<MediaViewerProps> = memo(({
  visible,
  mediaItems,
  initialIndex,
  onClose,
}) => {
  const { width, height } = useWindowDimensions();
  const validInitialIndex = Math.max(0, Math.min(initialIndex, mediaItems.length - 1));
  const [_, setCurrentIndex] = useState(validInitialIndex);

  useEffect(() => {
    if (Platform.OS !== 'web' && visible) {
      StatusBar.setHidden(true);
      return () => StatusBar.setHidden(false);
    }
  }, [visible]);

  const mediaWidth = Platform.OS === 'web' ? Math.min(width * 0.8, 1200) : width;
  const mediaHeight = Platform.OS === 'web' ? height * 0.8 : height;

  const renderMediaItem = useCallback(({ item }: { item: MediaAttachment }) => (
    <CarouselRenderItem
      item={item}
      mediaWidth={mediaWidth}
      mediaHeight={mediaHeight}
    />
  ), [mediaWidth, mediaHeight]);

  const handleSnapToItem = useCallback((index: number) => {
    runOnJS(setCurrentIndex)(index);
  }, []);

  const modalStyle = [styles.modalContainer, { backgroundColor: 'black' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS !== 'web'}
    >
      <View style={modalStyle}>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>
        )}

        <Carousel
          data={mediaItems}
          renderItem={renderMediaItem}
          width={width}
          height={height}
          pagingEnabled
          defaultIndex={validInitialIndex}
          onSnapToItem={handleSnapToItem}
          enabled={true}
          loop={false}
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
          windowSize={3}
        />
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }
    })
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -15 }],
    zIndex: 1,
    padding: 8,
  },
  pagination: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 40,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)',
  },
  paginationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  audioContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  audioPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginTop: 20,
  },
});
