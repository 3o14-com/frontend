import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
}

export const TouchableButton: React.FC<ButtonProps> = ({ onPress, title, disabled }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 16,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

