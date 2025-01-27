import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ComposeComponent } from '@/components/common/Compose/ComposeComponent';
import { Ionicons } from '@expo/vector-icons';

export default function ComposeScreen() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    closeButton: {
      paddingLeft: 15,
      paddingRight: 5,
    },
  });

  const handleClose = () => {
    router.push('/(tabs)');
  };

  const handleSubmitSuccess = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Make a Post',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          presentation: 'transparentModal',
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ComposeComponent
        initialContent=""
        onClose={handleClose}
        onSubmit={handleSubmitSuccess}
      />
    </View>
  );
}
