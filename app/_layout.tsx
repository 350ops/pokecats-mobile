import { Colors } from '@/constants/Colors';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { initDatabase, seedDatabase } from '@/lib/database';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

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

  // Handle Protection - Seeding is disabled for production
  // To enable seeding for development, set EXPO_PUBLIC_AUTO_SEED=true in .env
  const hasSeededRef = useRef(false);
  const shouldAutoSeed = process.env.EXPO_PUBLIC_AUTO_SEED === 'true';

  useEffect(() => {
    if (!initialized) return;

    // Check if user is on the login screen
    // segments[0] might be (tabs), modal, cat, update, or login
    const inLoginGroup = segments[0] === 'login';

    if (session) {
      // User is logged in
      // Only seed when explicitly enabled via EXPO_PUBLIC_AUTO_SEED=true
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

  // Native splash screen is handled by preventAutoHideAsync and hideAsync above.

  return (
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: 'Map', headerBackTitle: 'Back' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Sighting', headerShown: true }} />
        <Stack.Screen name="report" options={{ presentation: 'modal', title: 'Add Cat', headerShown: true }} />
        <Stack.Screen name="clips/record" options={{ title: 'Record Clip', headerShown: false }} />
        <Stack.Screen name="cat/[id]/index" options={{ title: 'Cat Profile', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="cat/[id]/edit" options={{ title: 'Edit Cat', presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="update" options={{ title: 'Update Cat', headerBackTitle: 'Back', headerShown: true }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile', headerBackTitle: 'Back', headerShown: true }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <LanguageProvider>
        <RootLayoutContent />
      </LanguageProvider>
    </AppThemeProvider>
  );
}
