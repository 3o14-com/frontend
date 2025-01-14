import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageService = {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  },
};
