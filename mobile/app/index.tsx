import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants';

export default function Splash() {
  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 1500));
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        router.replace('/(tabs)/');
        return;
      }
      const onboardingDone = await AsyncStorage.getItem('onboarding_done');
      if (onboardingDone) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(onboarding)/');
      }
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌸</Text>
      <Text style={styles.title}>MomMind AI</Text>
      <Text style={styles.sub}>Your supportive companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 32,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
  },
  sub: { fontSize: 16, color: colors.textSecondary },
});
