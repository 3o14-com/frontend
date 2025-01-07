import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ComposeComponent } from '@/components/common/Compose/ComposeComponent';
import type { Post } from '@/types/api';

export default function ComposeModal() {
  const theme = useTheme();
  const params = useLocalSearchParams();

  // Get reply context from params
  const replyToId = params.replyToId as string;
  const replyToPost = params.replyToPost ?
    JSON.parse(decodeURIComponent(atob(params.replyToPost as string))) as Post :
    undefined;

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerButton: {
      padding: theme.spacing.small,
    },
  });

  const handleClose = () => {
    router.back();
  };

  // This is a passthrough handler that will be called after ComposeComponent's 
  const handleSubmitSuccess = () => {
    router.back();
  };

  return (
    <View style={styles.modalContainer}>
      <Stack.Screen
        options={{
          title: replyToId ? 'Reply' : 'New Post',
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
              style={styles.headerButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ComposeComponent
        initialContent=""
        replyToPost={replyToPost}
        onClose={handleClose}
        onSubmit={handleSubmitSuccess}
      />
    </View>
  );
}
