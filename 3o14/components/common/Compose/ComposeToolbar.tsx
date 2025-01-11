import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComposeToolbarProps } from './types';

export const ComposeToolbar: React.FC<ComposeToolbarProps> = ({
  onPickImage,
  onToggleContentWarning,
  onSelectVisibility,
  onSubmit,
  onMention,
  showContentWarning,
  visibility,
  isSubmitting,
  hasContent,
  mediaCount,
  theme,
}) => {
  const styles = StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.medium,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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
  });

  return (
    <View style={styles.toolbar}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMention}
        >
          <Ionicons name="at" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPickImage}
          disabled={mediaCount >= 4}
        >
          <Ionicons
            name="image"
            size={24}
            color={mediaCount >= 4 ? theme.colors.border : theme.colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleContentWarning}
        >
          <Ionicons
            name="warning"
            size={24}
            color={showContentWarning ? theme.colors.primary : theme.colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSelectVisibility}
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
          (!hasContent || isSubmitting) && styles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!hasContent || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.background} size="small" />
        ) : (
          <Ionicons name="send" size={20} color={theme.colors.background} />
        )}
      </TouchableOpacity>
    </View>
  );
};

