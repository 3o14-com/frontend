import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export const ReplyPreview: React.FC<{ account: string | undefined }> = ({ account, }) => {
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
