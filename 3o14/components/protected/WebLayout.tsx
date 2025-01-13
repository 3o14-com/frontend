import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { WebNavigation, RightSidebar } from './WebNavigation';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { StorageService } from '@/services/storage';

interface WebLayoutProps {
  children: React.ReactNode;
  currentRoute?: string;
}

const handleLogout = async () => {
  try {
    await StorageService.clear();
    router.push('/(auth)');
  } catch (error) {
    console.error("Failed to logout:", error);
  }
};

export const WebLayout: React.FC<WebLayoutProps> = ({ children, currentRoute = 'index' }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const styles = StyleSheet.create({
    webLayoutContainer: {
      flex: 1,
      flexDirection: 'row',
      height: '100%',
      backgroundColor: theme.colors.background,
    },
    webContent: {
      flex: 1,
      height: '100%',
      overflow: 'scroll',
    },
  });

  return (
    <View style={styles.webLayoutContainer}>
      <WebNavigation
        currentRoute={currentRoute}
        theme={theme}
        onLogout={handleLogout}
      />
      <View style={styles.webContent}>
        {children}
      </View>
      {width > 1100 && <RightSidebar theme={theme} />}
    </View>
  );
};
