import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebLayout } from '@/components/protected/WebLayout';
import { navigationItems } from '@/components/protected/WebNavigation';

export default function ProtectedLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const pathname = usePathname();
  const [contentWidth, setContentWidth] = useState<'big' | 'small'>(
    width > 768 ? 'big' : 'small'
  );

  useEffect(() => {
    setContentWidth(width > 768 ? 'big' : 'small');
  }, [width]);

  const showWebNav = isWeb && contentWidth === 'big';

  // Determine current route from pathname by removing '/protected/' prefix
  const currentRoute = navigationItems.find(
    item => pathname === item.path || (pathname === '/protected' && item.name === 'index')
  )?.name || 'index';

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
      marginTop: Platform.OS === 'ios' ? 6 : 4,
    },
  });

  if (showWebNav) {
    return (
      <WebLayout currentRoute={currentRoute}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          {navigationItems.map((item) => (
            <Tabs.Screen
              key={item.name}
              name={item.name}
              options={{ title: item.title }}
            />
          ))}
        </Tabs>
      </WebLayout>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarPosition: 'bottom',
          headerShown: false,
          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: theme.colors.background,
            borderRightColor: theme.colors.border,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarActiveBackgroundColor: theme.colors.background,
          tabBarInactiveTintColor: theme.colors.text,
          tabBarLabelStyle: {
            display: 'none',
          },
          tabBarIconStyle: styles.tabBarIcon,
        }}
      >
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
    </View>
  );
}
