import { Tabs, usePathname } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProtectedLayout() {
  const theme = useTheme();
  const { logout } = useAuth();

  const LogoutButton = () => (
    <View style={{ position: 'absolute', right: 10, top: 8 }}>
      <Button title="Logout" onPress={logout} />
    </View>
  );

  const pathname = usePathname();
  const isComposeScreen = pathname === '/compose';

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: 'bottom',
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 0,
          borderTopWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 0,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 55,
          paddingTop: 5,
          paddingBottom: 10,
          display: isComposeScreen ? 'none' : 'flex',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: Platform.OS === 'ios' ? 6 : 4,
        },
        ...(Platform.OS === 'ios' || Platform.OS === 'android'
          ? { swipeEnabled: true }
          : {}),
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
          headerRight: LogoutButton,
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
