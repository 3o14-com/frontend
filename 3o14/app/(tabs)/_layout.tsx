import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import React, { useMemo } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebLayout } from '@/components/protected/WebLayout';
import { navigationItems } from '@/components/protected/WebNavigation';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export default function TabsLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const contentWidth = useMemo(() => width > 768 ? 'big' : 'small', [width]);
  const showWebNav = isWeb && contentWidth === 'big';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      height: Platform.OS === 'web' ? 100 : '100%',
    },
    tabBar: {
      flexDirection: 'row',
      maxWidth: '100%',
      width: '100%',
      height: 55,
      paddingTop: 5,
      paddingBottom: 10,
      borderTopWidth: 0,
      borderRightWidth: 0,
    },
    tabBarIcon: {
      marginBottom: 0,
      marginTop: 4,
    },
  });

  const tabScreenOptions = useMemo((): BottomTabNavigationOptions => ({
    headerShown: false,
    tabBarStyle: {
      ...styles.tabBar,
      backgroundColor: theme.colors.background,
      borderRightColor: theme.colors.border,
      elevation: 0,
      display: showWebNav ? 'none' : 'flex',
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarActiveBackgroundColor: theme.colors.background,
    tabBarInactiveTintColor: theme.colors.text,
    tabBarHideOnKeyboard: true,
    tabBarLabelStyle: {
      display: 'none' as const,
    },
    tabBarIconStyle: styles.tabBarIcon,
  }), [theme.colors, showWebNav, styles]);

  const TabNavigator = useMemo(() => (
    <Tabs screenOptions={tabScreenOptions}>
      {navigationItems.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? item.icon.focused : item.icon.outline}
                size={item.size || 22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  ), [tabScreenOptions]);

  return showWebNav ? (
    <WebLayout>
      {TabNavigator}
    </WebLayout>
  ) : (
    <View style={styles.container}>
      {TabNavigator}
    </View>
  );
}
