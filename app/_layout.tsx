import { Colors } from '@/constants/Colors';
import { AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { initDatabase, seedDatabase } from '@/lib/database';
import { useEffect, useRef, useState } from 'react';

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

const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    text: Colors.light.text,
    card: Colors.light.background,
    border: Colors.glass.border,
    primary: Colors.primary.blue,
  },
};

import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const { isDark, colorScheme } = useTheme();

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
  const hasSeededRef = useRef(false);
  const shouldAutoSeed = process.env.EXPO_PUBLIC_AUTO_SEED === 'true' || (__DEV__ && process.env.EXPO_PUBLIC_AUTO_SEED !== 'false');

  useEffect(() => {
    if (!initialized) return;

    // Check if user is on the login screen
    // segments[0] might be (tabs), modal, cat, update, or login
    const inLoginGroup = segments[0] === 'login';

    if (session) {
      // User is logged in
      // Only seed when explicitly allowed (or in dev by default)
      if (shouldAutoSeed && !hasSeededRef.current) {
        hasSeededRef.current = true;
        seedDatabase();
      }

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
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: 'Map', headerBackTitle: 'Back' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Sighting', headerShown: true }} />
        <Stack.Screen name="cat/[id]" options={{ title: 'Cat Profile', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="cat/[id]/translate" options={{ title: 'Translator', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="update" options={{ title: 'Update Cat', headerBackTitle: 'Back', headerShown: true }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}

