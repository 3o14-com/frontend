import { useState } from 'react';
import { View, Pressable, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { StorageService } from '@/services/storage';
import { useTheme } from '@/hooks/useTheme';
import Confirm from '@/components/common/Confirm';

type ProtectedPath =
  | '/(tabs)'
  | '/(tabs)/local'
  | '/(tabs)/compose'
  | '/(tabs)/search'
  | '/(tabs)/profile';

interface NavigationItem {
  name: string;
  title: string;
  icon: {
    focused: keyof typeof Ionicons['glyphMap'];
    outline: keyof typeof Ionicons['glyphMap'];
  };
  size?: number;
  path: ProtectedPath | '/(tabs)';
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'index',
    title: 'Home',
    icon: { focused: 'home', outline: 'home-outline' },
    path: '/(tabs)',
  },
  {
    name: 'local',
    title: 'Local',
    icon: { focused: 'globe', outline: 'globe-outline' },
    path: '/(tabs)/local',
  },
  {
    name: 'compose',
    title: 'Compose',
    icon: { focused: 'add-circle', outline: 'add-circle-outline' },
    size: 30,
    path: '/(tabs)/compose',
  },
  {
    name: 'search',
    title: 'Search',
    icon: { focused: 'search', outline: 'search-outline' },
    path: '/(tabs)/search',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: { focused: 'person', outline: 'person-outline' },
    path: '/(tabs)/profile',
  },
];


const handleLogoutConfirm = async () => {
  try {
    await StorageService.clear();
    router.push('/(auth)');
  } catch (error) {
    console.error("Failed to logout:", error);
  }
};

interface WebNavigationProps {
  theme: ReturnType<typeof useTheme>;
  onLogout: () => Promise<void>;
  currentRoute: string;
}

export const WebNavigation: React.FC<WebNavigationProps> = ({ theme }) => {
  const currentPath = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const styles = StyleSheet.create({
    webNavContainer: {
      width: 250,
      height: '100%',
      paddingTop: 20,
      paddingHorizontal: 12,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      justifyContent: 'space-between',
    },
    navigationSection: {
      flex: 1,
    },
    logoutSection: {
      paddingBottom: 13,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 13,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 12,
    },
    webNavItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 12,
      marginBottom: 8,
    },
    webNavText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.webNavContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.navigationSection}>
        {navigationItems.map((item) => {
          const isExactMatch =
            item.path === '/(tabs)'
              ? currentPath === '/(tabs)' || currentPath === '/'
              : currentPath.startsWith(item.path.replace('/(tabs)', ''));

          return (
            <Pressable
              key={item.name}
              style={({ pressed }) => [
                styles.webNavItem,
                {
                  backgroundColor: pressed
                    ? theme.colors.border
                    : theme.colors.background,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => router.push(item.path as any)}
            >
              <Ionicons
                name={isExactMatch ? item.icon.focused : item.icon.outline}
                size={item.size || 22}
                color={isExactMatch ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[
                  styles.webNavText,
                  { color: isExactMatch ? theme.colors.primary : theme.colors.text }
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.logoutSection}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: pressed ? theme.colors.border : theme.colors.background,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={theme.colors.text}
          />
          <Text style={[styles.webNavText, { color: theme.colors.text }]}>
            Logout
          </Text>
        </Pressable>
      </View>

      <Confirm
        visible={showLogoutConfirm}
        message="Are you sure you want to logout?"
        extraMessage="You'll need to sign in again to access your account."
        options={[
          {
            text: 'Cancel',
            onPress: () => setShowLogoutConfirm(false),
            icon: 'close-outline'
          },
          {
            text: 'Logout',
            onPress: handleLogoutConfirm,
            destructive: true,
            icon: 'log-out-outline'
          },
        ]}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </View >
  );
};

export const RightSidebar: React.FC<{ theme: ReturnType<typeof useTheme> }> = ({ theme }) => {
  const styles = StyleSheet.create({
    container: {
      width: 350,
      height: '100%',
      paddingTop: 20,
      paddingHorizontal: 16,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      justifyContent: 'space-between',
    },
    topSection: {
      flex: 1,
    },
    bottomSection: {
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 20,
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    logo: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    projectName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.title}>A Decentralized Social Media for Scientific Communication</Text>
        <Text style={styles.description}>
          A federated social media for scientific communicators.
        </Text>
        <Text>-</Text>
        <Text style={styles.description}>
          Scientific communication plays a vital role in advancing research and knowledge sharing across academic communities. Traditional social media platforms while effective for general communication often lacks specialized features necessary for scientific discource. The emergence of decentralized technologies particularly the ActivityPub Protocol and the Fediverse presents an oppurtunity to create a more suitable platform for academic communication and this project aims to be just that.
        </Text>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.projectName}>③⓪①④.com</Text>
          <Image
            source={require('@/assets/images/makuro.png')}
            style={styles.logo}
          />
        </View>
      </View>
    </View>
  );
};
