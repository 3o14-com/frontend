import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { Platform, useWindowDimensions, View, Pressable, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { StorageService } from '@/services/storage';

// Define specific path type for type safety
type ProtectedPath =
  | '/protected'
  | '/protected/local'
  | '/protected/compose'
  | '/protected/search'
  | '/protected/profile';

interface NavigationItem {
  name: string;
  title: string;
  icon: {
    focused: keyof typeof Ionicons['glyphMap'];
    outline: keyof typeof Ionicons['glyphMap'];
  };
  size?: number;
  path: ProtectedPath | '/protected';
}

const navigationItems: NavigationItem[] = [
  {
    name: 'index',
    title: 'Home',
    icon: { focused: 'home', outline: 'home-outline' },
    path: '/protected',
  },
  {
    name: 'local',
    title: 'Local',
    icon: { focused: 'globe', outline: 'globe-outline' },
    path: '/protected/local',
  },
  {
    name: 'compose',
    title: 'Compose',
    icon: { focused: 'add-circle', outline: 'add-circle-outline' },
    size: 30,
    path: '/protected/compose',
  },
  {
    name: 'search',
    title: 'Search',
    icon: { focused: 'search', outline: 'search-outline' },
    path: '/protected/search',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: { focused: 'person', outline: 'person-outline' },
    path: '/protected/profile',
  },
];

const handleLogout = async () => {
  try {
    await StorageService.clear();
    router.push('/');
  } catch (error) {
    console.error("Failed to logout:", error);
  }
};

interface WebNavigationProps {
  currentRoute: string;
  theme: ReturnType<typeof useTheme>;
  onLogout: () => Promise<void>;
}


const WebNavigation: React.FC<WebNavigationProps> = ({ currentRoute, theme }) => {

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
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 20,
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
        <View style={styles.navigationSection}>
          {navigationItems.map((item) => (
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
                name={currentRoute === item.name ? item.icon.focused : item.icon.outline}
                size={item.size || 22}
                color={currentRoute === item.name ? theme.colors.primary : theme.colors.text}
              />
              <Text style={[styles.webNavText, { color: currentRoute === item.name ? theme.colors.primary : theme.colors.text }]}>
                {item.title}
              </Text>
            </Pressable>
          ))
          }
        </View >
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
          onPress={handleLogout}
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
    </View >
  );
};

const RightSidebar: React.FC<{ theme: ReturnType<typeof useTheme> }> = ({ theme }) => {
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
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 20,
      alignItems: 'flex-start',
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
    link: {
      color: theme.colors.primary,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.title}>A Decentralized Social Media for Scientific Communication</Text>
        <Text style={styles.description}>
          A federated social media focusing on scientific communication. We, the people of science, share a universal language of discovery.
        </Text>
        <Text>
          -
        </Text>
        <Text style={styles.description}>
          Scientific communication plays a vital role in advancing research and knowledge sharing across academic communities. Traditional social media platforms while effective for general communication often lacks specialized features necessary for scientific discource. The emergence of decentralized technologies particularly the ActivityPub Protocol and the Fediverse presents an oppurtunity to create a more suitable platform for academic communication and this project aims to be just that.
        </Text>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/makuro.png')}
            style={styles.logo}
          />
          <Text style={styles.projectName}>3o14.com</Text>
        </View>
      </View>
    </View>
  );
};

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

  // Show web navigation for web + large screens, otherwise show bottom tabs
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
    webLayoutContainer: {
      flex: 1,
      flexDirection: 'row',
      height: '100%',
    },
    webContent: {
      flex: 1,
      height: '100%',
      overflow: 'scroll',
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

  return (
    <View style={styles.container}>
      {showWebNav ? (
        <View style={styles.webLayoutContainer}>
          <WebNavigation
            currentRoute={currentRoute}
            theme={theme}
            onLogout={handleLogout}
          />
          <View style={styles.webContent}>
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
          </View>
          {width > 1100 && <RightSidebar theme={theme} />}
        </View>
      ) : (
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
      )}
    </View>
  );
}

