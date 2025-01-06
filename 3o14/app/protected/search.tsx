import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';


export default function Search() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    icon: {
      marginBottom: 16,
    },
    text: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={64} color={theme.colors.text} style={styles.icon} />
      <Text style={styles.text}>Search Page</Text>
    </View>
  );
}

