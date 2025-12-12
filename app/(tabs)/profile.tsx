import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { VisionOSInlineMenu, type MenuSection } from '@/components/ui/VisionOSMenu';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import placeholderAvatar from '@/userPlaceholder.png';
import { Session } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const [session, setSession] = useState<Session | null>(null);
    const { isDark, preference, setPreference } = useTheme();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useFocusEffect(useCallback(() => {
        let isActive = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isActive) setSession(session);
        });
        return () => {
            isActive = false;
        };
    }, []));

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Navigation will be handled by the onAuthStateChange in _layout.tsx
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [darkModeEnabled, setDarkModeEnabled] = useState(preference === 'dark');

    useEffect(() => {
        let isMounted = true;

        const loadPermissions = async () => {
            const notificationSettings = await Notifications.getPermissionsAsync();
            const hasNotificationPermission =
                notificationSettings.granted ||
                notificationSettings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

            const locationSettings = await Location.getForegroundPermissionsAsync();
            if (isMounted) {
                setNotificationsEnabled(Boolean(hasNotificationPermission));
                setLocationEnabled(locationSettings.status === Location.PermissionStatus.GRANTED);
            }
        };

        loadPermissions();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        setDarkModeEnabled(preference === 'dark');
    }, [preference]);

    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const permission = await Notifications.requestPermissionsAsync();
            const granted =
                permission.granted ||
                permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
            setNotificationsEnabled(granted);
            if (!granted) {
                Alert.alert('Permission needed', 'Enable notifications in system settings to stay informed.');
            }
        } else {
            setNotificationsEnabled(false);
            if (Platform.OS !== 'web') {
                Linking.openSettings();
            }
        }
    };

    const handleLocationToggle = async (value: boolean) => {
        if (value) {
            const permission = await Location.requestForegroundPermissionsAsync();
            const granted = permission.status === Location.PermissionStatus.GRANTED;
            setLocationEnabled(granted);
            if (!granted) {
                Alert.alert('Permission needed', 'Location access keeps your alerts relevant. You can enable it in Settings.');
            }
        } else {
            setLocationEnabled(false);
            if (Platform.OS !== 'web') {
                Linking.openSettings();
            }
        }
    };

    const handleDarkModeToggle = (value: boolean) => {
        setDarkModeEnabled(value);
        setPreference(value ? 'dark' : 'light');
    };

    const user = useMemo(() => ({
        name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Alex D.',
        role: 'Community Guardian',
        avatarUri: session?.user?.user_metadata?.avatar_url,
        area: session?.user?.user_metadata?.area,
        stats: {
            sightings: 42,
            fed: 156,
            adopted: 2
        }
    }), [session?.user?.email, session?.user?.user_metadata?.avatar_url, session?.user?.user_metadata?.name, session?.user?.user_metadata?.area]);

    const avatarSource = user.avatarUri ? { uri: user.avatarUri } : placeholderAvatar;

    const openSystemSettings = useCallback(() => {
        if (Platform.OS !== 'web') {
            Linking.openSettings();
        }
    }, []);

    const preferenceSections: MenuSection[] = useMemo(() => [
        {
            id: 'account',
            title: 'Account',
            items: [
                {
                    id: 'edit-profile',
                    title: 'Edit Profile',
                    subtitle: 'Update name, email, and area',
                    icon: 'person.crop.circle',
                    rightIcon: 'chevron.right',
                    onPress: () => router.push('/profile/edit'),
                },
                {
                    id: 'privacy',
                    title: 'Privacy',
                    subtitle: 'Control who sees your activity',
                    icon: 'lock.shield',
                    rightIcon: 'chevron.right',
                    onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.'),
                },
            ],
        },
        {
            id: 'app',
            title: 'App Settings',
            items: [
                {
                    id: 'system-settings',
                    title: 'System Settings',
                    subtitle: 'Manage permissions in iOS Settings',
                    icon: 'gear',
                    rightIcon: 'arrow.up.right',
                    onPress: openSystemSettings,
                },
                {
                    id: 'help',
                    title: 'Help & Support',
                    icon: 'questionmark.circle',
                    rightIcon: 'chevron.right',
                    onPress: () => Alert.alert('Help', 'Contact us at support@pokecats.app'),
                },
                {
                    id: 'about',
                    title: 'About PokéCats',
                    icon: 'info.circle',
                    rightText: 'v1.0.1',
                    onPress: () => Alert.alert('PokéCats', 'Version 1.0.1\n\nHelping communities care for stray cats.'),
                },
            ],
        },
    ], [openSystemSettings]);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image source={avatarSource} style={styles.avatar} />
                    <Text style={[styles.name, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{user.name}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                    <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 5 }}>{session?.user?.email}</Text>
                    {!!user.area && (
                        <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 4 }}>
                            {user.area}
                        </Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <GlassView style={styles.statCard} intensity={isDark ? 20 : 0}>
                        <View style={{ backgroundColor: isDark ? 'transparent' : '#FFFFFF', width: '100%', alignItems: 'center' }}>
                            <Text style={[styles.statNumber, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{user.stats.sightings}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Sightings</Text>
                        </View>
                    </GlassView>
                    <GlassView style={styles.statCard} intensity={isDark ? 20 : 0}>
                        <View style={{ backgroundColor: isDark ? 'transparent' : '#FFFFFF', width: '100%', alignItems: 'center' }}>
                            <Text style={[styles.statNumber, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{user.stats.fed}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Times Fed</Text>
                        </View>
                    </GlassView>
                    <GlassView style={styles.statCard} intensity={isDark ? 20 : 0}>
                        <View style={{ backgroundColor: isDark ? 'transparent' : '#FFFFFF', width: '100%', alignItems: 'center' }}>
                            <Text style={[styles.statNumber, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{user.stats.adopted}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Managed</Text>
                        </View>
                    </GlassView>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Preferences</Text>

                    <VisionOSInlineMenu
                        sections={preferenceSections}
                        style={styles.preferencesMenu}
                    />

                    {/* Toggle controls below menu */}
                    <View style={styles.togglesContainer}>
                        <View style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={styles.toggleInfo}>
                                <Text style={[styles.toggleTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                    Notifications
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: 'rgba(120,120,128,0.32)', true: Colors.primary.green }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="rgba(120,120,128,0.32)"
                            />
                        </View>

                        <View style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={styles.toggleInfo}>
                                <Text style={[styles.toggleTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                    Location Access
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {locationEnabled ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                            <Switch
                                value={locationEnabled}
                                onValueChange={handleLocationToggle}
                                trackColor={{ false: 'rgba(120,120,128,0.32)', true: Colors.primary.green }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="rgba(120,120,128,0.32)"
                            />
                        </View>

                        <View style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={styles.toggleInfo}>
                                <Text style={[styles.toggleTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                    Dark Mode
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {darkModeEnabled ? 'On' : 'Off'}
                                </Text>
                            </View>
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={handleDarkModeToggle}
                                trackColor={{ false: 'rgba(120,120,128,0.32)', true: Colors.primary.green }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="rgba(120,120,128,0.32)"
                            />
                        </View>
                    </View>
                </View>

                <GlassButton
                    title="Log Out"
                    variant="glass"
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 80,
        paddingBottom: 100,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: Colors.glass.border,
        marginBottom: 16,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        // color: Colors.glass.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: Colors.primary.green,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
        gap: 12,
    },
    statCard: {
        flex: 1,
        // padding: 16, // Moved to inner view
        alignItems: 'center',
        borderRadius: 20,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        // color: Colors.glass.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        // color: Colors.glass.textSecondary,
        textAlign: 'center',
    },
    section: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        // color: Colors.glass.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    preferencesMenu: {
        width: '100%',
        marginBottom: 20,
    },
    togglesContainer: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        gap: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 17,
        fontWeight: '400',
    },
    toggleSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    logoutBtn: {
        width: '100%',
        borderColor: '#ff4444',
    }
});
