import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { initDb } from '@/db/index';
import { useIsOffline } from '@/services/api';
import { replayQueue } from '@/sync/syncService';

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isOffline = useIsOffline();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      await initDb();
      await loadFromStorage();
    };
    init();
  }, []);

  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      console.log('[sync] back online — replaying queue');
      replayQueue();
    }
    wasOfflineRef.current = isOffline;
  }, [isOffline]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
