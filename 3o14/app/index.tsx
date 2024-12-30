import React from 'react';
import { View, Image, ScrollView, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { LoginForm } from '@/components/auth/LoginForm';
import { useTheme } from '@/hooks/useTheme';
import { useAuthState } from '@/hooks/authState';
import { Loading } from '@/components/common/Loading';

export default function Login() {
  const theme = useTheme();
  const { isLoading } = useAuthState();
  const { width } = Dimensions.get('window');
  const isWebLayout = width > 600;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.small,
    },
    loginImage: {
      width: 200,
      height: 200,
      marginBottom: theme.spacing.large,
    },
    formContainer: {
      width: isWebLayout ? 600 : '100%',
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={require('@/assets/images/makuro.png')}
          style={styles.loginImage}
        />
        <View style={styles.formContainer}>
          <LoginForm />
        </View>
      </ScrollView>
    </View>
  );
}
