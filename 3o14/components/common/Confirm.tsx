import React from 'react';
import { Modal, Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

// Define the type for Ionicons names
type IconNames = keyof typeof Ionicons.glyphMap;

type Option = {
  text: string;
  onPress: () => void;
  icon?: IconNames;
  destructive?: boolean;
};

type ConfirmProps = {
  visible: boolean;
  message: string;
  extraMessage?: string;
  options: Option[];
  onClose: () => void;
};

const Confirm: React.FC<ConfirmProps> = ({ visible, message, extraMessage, options, onClose }) => {
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
      maxWidth: 400,
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
    messageContainer: {
      marginBottom: theme.spacing.medium,
      paddingHorizontal: theme.spacing.small,
    },
    message: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
    },
    extraMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.small,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      borderRadius: 8,
    },
    optionText: {
      fontSize: 14,
      marginLeft: theme.spacing.medium,
      flex: 1,
    },
    destructiveOption: {
      backgroundColor: `${theme.colors.error}10`,
    },
    destructiveText: {
      color: theme.colors.error,
    },
    normalText: {
      color: theme.colors.text,
    },
  });

  const getIconName = (option: Option): IconNames => {
    return option.icon || (option.destructive ? 'trash-outline' : 'checkmark-outline') as IconNames;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
            {extraMessage && (
              <Text style={styles.extraMessage}>{extraMessage}</Text>
            )}
          </View>
          <View>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={[
                  styles.option,
                  option.destructive && styles.destructiveOption,
                ]}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
              >
                <Ionicons
                  name={getIconName(option)}
                  size={24}
                  color={option.destructive ? theme.colors.error : theme.colors.text}
                />
                <Text
                  style={[
                    styles.optionText,
                    option.destructive ? styles.destructiveText : styles.normalText,
                  ]}
                >
                  {option.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default Confirm;
