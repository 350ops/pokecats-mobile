import { GlassTabBar } from '@/components/ui/GlassTabBar';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
