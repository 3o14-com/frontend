import React from 'react';
import { Modal, Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Option = {
  text: string | null;
  onPress: () => void;
  style?: object;
};

type ConfirmProps = {
  visible: boolean;
  message: string | null;
  options: Option[];
  onClose: () => void;
};

const Confirm: React.FC<ConfirmProps> = ({ visible, message, options, onClose }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: theme.spacing.small,
      width: Platform.OS === 'web' ? 300 : '80%',
      maxWidth: 600,
      ...Platform.select({
        web: {
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        default: {
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
      }),
    },
    message: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
    },
    optionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    optionButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    optionText: {
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.background }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.message, { color: theme.colors.text }]}>{message || "No message provided"}</Text>
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={[styles.optionButton, option.style, { backgroundColor: theme.colors.primary }]}
                onPress={option.onPress}
              >
                <Text style={[styles.optionText, { color: theme.colors.text }]}>{option.text || "Unnamed option"}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


export default Confirm;
