import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Visibility } from './types';

interface VisibilitySelectorProps {
  visible: boolean;
  options: Visibility[];
  selectedVisibility: Visibility;
  onSelect: (visibility: Visibility) => void;
  theme: any;
}

export const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  visible,
  options,
  selectedVisibility,
  onSelect,
  theme,
}) => {
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    content: {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      borderTopLeftRadius: theme.borderRadius.large,
      borderTopRightRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.medium,
    },
    optionText: {
      marginLeft: theme.spacing.medium,
      color: theme.colors.text,
      fontSize: 16,
    },
    closeButton: {
      padding: theme.spacing.small,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => onSelect(selectedVisibility)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Post visibility</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => onSelect(selectedVisibility)}
            >
              <Ionicons
                name="arrow-down"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          {options.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={styles.option}
              onPress={() => onSelect(option)}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={option.type === selectedVisibility.type
                  ? theme.colors.primary
                  : theme.colors.text}
              />
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};
