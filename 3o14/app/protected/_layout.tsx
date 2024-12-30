import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProtectedLayout() {
  const theme = useTheme();
  const { logout } = useAuth();

  const LogoutButton = () => (
    <View style={{ position: 'absolute', right: 10, top: 8 }}>
      <Button
        title="Logout"
        onPress={logout}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: 'top',
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
          height: 50,
          paddingTop: Platform.OS === 'ios' ? 8 : 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
          paddingVertical: Platform.OS === 'ios' ? 8 : 6,
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
          // Use headerRight for the logout button
          headerRight: LogoutButton,
        }}
      />
      <Tabs.Screen
        name="local"
        options={{
          title: 'Local',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
