import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { Account } from '@/types/api';
import type { Theme } from '@/types/theme';

interface MentionSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  theme: Theme;
}

export const MentionSelector: React.FC<MentionSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      minHeight: '50%',
      maxHeight: '50%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.medium,
    },
    searchInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      fontSize: 16,
    },
    accountItem: {
      flexDirection: 'row',
      padding: theme.spacing.medium,
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    accountInfo: {
      marginLeft: theme.spacing.medium,
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    username: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    loadingContainer: {
      padding: theme.spacing.medium,
    },
    closeButton: {
      padding: theme.spacing.small,
      marginLeft: theme.spacing.medium,
    },
  });

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const server = await StorageService.get('server');
      if (!server) throw new Error('Server not configured');

      const accounts = await ApiService.searchAccounts(server, searchQuery.trim());
      setResults(accounts);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (account: Account) => {
    onSelect(account);
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search for users to mention..."
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons
                name="arrow-down"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.accountItem}
                  onPress={() => handleSelect(item)}
                >
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatar}
                    defaultSource={require('@/assets/images/makuro.png')}
                  />
                  <View style={styles.accountInfo}>
                    <Text style={styles.displayName}>{item.display_name}</Text>
                    <Text style={styles.username}>@{item.acct}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal >
  );
};
