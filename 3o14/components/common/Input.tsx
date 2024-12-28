import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    input: {
      height: 40,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.small,
      paddingHorizontal: theme.spacing.medium,
      marginBottom: theme.spacing.small,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
  });

  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      onSubmitEditing={onSubmitEditing}
      placeholderTextColor={theme.colors.border}
      returnKeyType="done"
    />
  );
};
