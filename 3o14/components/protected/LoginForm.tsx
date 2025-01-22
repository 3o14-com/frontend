import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TouchableButton } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export const LoginForm: React.FC = () => {
  const [server, setServer] = useState('');
  const { login, isLoading } = useAuth();
  const theme = useTheme();

  const isValidUrl = (url: string): boolean => {
    const urlPattern = /^(https?:\/\/)?((([0-9]{1,3}\.){3}[0-9]{1,3})|([a-z0-9-]+\.)+[a-z]{2,})(:\d+)?(\/.*)?$/i;
    return urlPattern.test(url);
  };

  const handleLogin = async () => {
    try {
      await login(server);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.large,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium,
      maxWidth: 600,
    },
    title: {
      fontSize: 20,
      marginBottom: theme.spacing.medium,
      color: theme.colors.text,
    },
    subtitle: {
      fontStyle: 'italic',
      color: theme.colors.text,
      marginTop: theme.spacing.medium,
    },
  });

  if (isLoading) return <Loading />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Instance:</Text>
      <Input
        value={server}
        onChangeText={setServer}
        placeholder="eg: example.com"
        onSubmitEditing={handleLogin}
      />
      <TouchableButton
        title="Confirm"
        onPress={handleLogin}
        disabled={!isValidUrl(server)}
      />
      <Text style={styles.subtitle}>
        Your Fediverse instance is a unique social media server that enables you to connect, share, and interact with a diverse community across a decentralized network.
      </Text>
    </View>
  );
};
