import { Colors } from '@/constants/Colors';
import { DarkTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { initDatabase, seedDatabase } from '@/lib/database';
import { useEffect, useState } from 'react';

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.primary.dark,
    text: Colors.dark.text,
    card: Colors.primary.dark,
    border: Colors.glass.border,
    primary: Colors.primary.green,
  },
};

import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Initialize DB structure (Schema is server-side, this is just a log)
    initDatabase();
  }, []);

  useEffect(() => {
    // 2. Check Auth Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // 3. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle Protection and Seeding
  useEffect(() => {
    if (!initialized) return;

    // Check if user is on the login screen
    // segments[0] might be (tabs), modal, cat, update, or login
    const inLoginGroup = segments[0] === 'login';

    if (session) {
      // User is logged in
      // Try to seed data now that we have auth (if needed)
      seedDatabase();

      // If on login screen, go to tabs
      if (inLoginGroup) {
        router.replace('/(tabs)');
      }
    } else if (!session) {
      // User is NOT logged in
      // If not on login screen, go to login
      if (!inLoginGroup) {
        router.replace('/login');
      }
    }
  }, [session, initialized, segments]);

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: 'Map', headerBackTitle: 'Back' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Sighting', headerShown: true }} />
        <Stack.Screen name="cat/[id]" options={{ title: 'Cat Profile', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="cat/[id]/translate" options={{ title: 'Translator', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="update" options={{ title: 'Update Cat', headerBackTitle: 'Back', headerShown: true }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
