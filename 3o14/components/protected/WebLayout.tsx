import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { WebNavigation, RightSidebar } from './WebNavigation';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

interface WebLayoutProps {
  children: React.ReactNode;
  currentRoute?: string;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children, currentRoute = 'index' }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();

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
      overflow: 'hidden',
    },
  });

  return (
    <View
      style={styles.webLayoutContainer}>
      <WebNavigation
        currentRoute={currentRoute}
        theme={theme}
        onLogout={logout}
      />
      <View style={styles.webContent}>
        {children}
      </View>
      {width > 1100 && <RightSidebar theme={theme} />}
    </View>
  );
};
