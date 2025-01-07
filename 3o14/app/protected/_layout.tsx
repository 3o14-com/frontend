import { Tabs, usePathname } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProtectedLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const [tabBarPosition, setTabBarPosition] = useState<'left' | 'bottom'>(
    width > 768 ? 'left' : 'bottom'
  );

  useEffect(() => {
    setTabBarPosition(width > 768 ? 'left' : 'bottom');
  }, [width]);

  const pathname = usePathname();
  const isComposeScreen = pathname === '/compose';

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: isWeb ? tabBarPosition : 'bottom',
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 0,
          borderTopWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderRightColor: theme.colors.border,
          borderTopWidth: 0,
          borderRightWidth: 1,
          flexDirection: isWeb && tabBarPosition === 'left' ? 'column' : 'row',
          maxWidth: isWeb && tabBarPosition === 'left' ? 100 : '100%',
          width: isWeb && tabBarPosition === 'left' ? 100 : '100%',
          height: tabBarPosition === 'bottom' ? 55 : '100%',
          paddingTop: 5,
          paddingBottom: 10,
          display: isComposeScreen ? 'none' : 'flex',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarActiveBackgroundColor: theme.colors.background,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarLabelStyle: {
          display: isWeb && tabBarPosition === 'left' ? 'flex' : 'none',
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: Platform.OS === 'ios' ? 6 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="local"
        options={{
          title: 'Local',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'globe' : 'globe-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Compose',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
