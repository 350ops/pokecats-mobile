import { GlassButton } from '@/components/ui/GlassButton';
import { StatCard } from '@/components/ui/StatCard';
import { VisionOSInlineMenu, type MenuSection } from '@/components/ui/VisionOSMenu';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { ActionSheetIOS, Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import placeholderAvatar from '@/userPlaceholder.png';
import { useFocusEffect } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ProfileScreen() {
    const [session, setSession] = useState<Session | null>(null);
    const { isDark, preference, setPreference } = useTheme();
    const { language, setLanguage, t } = useLanguage();
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

    // Fetch user's stats from database
    useEffect(() => {
        const fetchUserStats = async () => {
            if (!session?.user?.id) {
                setClipsCount(0);
                setSightingsCount(0);
                setFeedingsCount(0);
                return;
            }

            try {
                // Fetch clips count
                const { count: clips } = await supabase
                    .from('cat_clips')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id);

                if (clips !== null) setClipsCount(clips);

                // Fetch feedings count (cats the user has fed)
                const { count: feedings } = await supabase
                    .from('cat_feedings')
                    .select('*', { count: 'exact', head: true });
                // Note: cat_feedings doesn't have user_id, so this counts all feedings
                // TODO: Add user_id to cat_feedings table for per-user tracking

                if (feedings !== null) setFeedingsCount(feedings);

                // Fetch sightings count (cats added/reported by user)
                // Using cats table - ideally would have a created_by field
                const { count: sightings } = await supabase
                    .from('cats')
                    .select('*', { count: 'exact', head: true });
                // Note: cats table doesn't have created_by, so this counts all cats
                // TODO: Add created_by to cats table for per-user tracking

                if (sightings !== null) setSightingsCount(sightings);
            } catch (e) {
                console.error('Error fetching user stats:', e);
            }
        };
        fetchUserStats();
    }, [session?.user?.id]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Navigation will be handled by the onAuthStateChange in _layout.tsx
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [darkModeEnabled, setDarkModeEnabled] = useState(preference === 'dark');
    const [clipsCount, setClipsCount] = useState(0);
    const [sightingsCount, setSightingsCount] = useState(0);
    const [feedingsCount, setFeedingsCount] = useState(0);

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

    const handleLanguagePress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [t.common.cancel, t.common.english, t.common.spanish],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) setLanguage('en');
                    else if (buttonIndex === 2) setLanguage('es');
                }
            );
        } else {
            Alert.alert(
                t.profile.language,
                '',
                [
                    { text: t.common.english, onPress: () => setLanguage('en') },
                    { text: t.common.spanish, onPress: () => setLanguage('es') },
                    { text: t.common.cancel, style: 'cancel' },
                ]
            );
        }
    };

    const user = useMemo(() => ({
        name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || '',
        role: session?.user?.user_metadata?.role || '',
        avatarUri: session?.user?.user_metadata?.avatar_url,
        area: session?.user?.user_metadata?.area,
        stats: {
            sightings: sightingsCount,
            fed: feedingsCount,
            clips: clipsCount
        }
    }), [session?.user?.email, session?.user?.user_metadata?.avatar_url, session?.user?.user_metadata?.name, session?.user?.user_metadata?.area, session?.user?.user_metadata?.role, clipsCount, sightingsCount, feedingsCount]);

    const avatarSource = user.avatarUri ? { uri: user.avatarUri } : placeholderAvatar;

    const openSystemSettings = useCallback(() => {
        if (Platform.OS !== 'web') {
            Linking.openSettings();
        }
    }, []);

    const preferenceSections: MenuSection[] = useMemo(() => [
        {
            id: 'account',
            title: t.profile.account,
            items: [
                {
                    id: 'edit-profile',
                    title: t.profile.editProfile,
                    subtitle: t.profile.editProfileSubtitle,
                    icon: 'person.crop.circle',
                    rightIcon: 'chevron.right',
                    onPress: () => router.push('/profile/edit'),
                },
                {
                    id: 'privacy',
                    title: t.profile.privacy,
                    subtitle: t.profile.privacySubtitle,
                    icon: 'lock.shield',
                    rightIcon: 'chevron.right',
                    onPress: () => Alert.alert(t.profile.comingSoon, t.profile.privacyComingSoon),
                },
            ],
        },
        {
            id: 'app',
            title: t.profile.appSettings,
            items: [
                {
                    id: 'system-settings',
                    title: t.profile.systemSettings,
                    subtitle: t.profile.systemSettingsSubtitle,
                    icon: 'gear',
                    rightIcon: 'arrow.up.right',
                    onPress: openSystemSettings,
                },
                {
                    id: 'help',
                    title: t.profile.helpSupport,
                    icon: 'questionmark.circle',
                    rightIcon: 'chevron.right',
                    onPress: () => Alert.alert('Help', t.profile.helpMessage),
                },
                {
                    id: 'about',
                    title: t.profile.about,
                    icon: 'info.circle',
                    rightText: 'v1.2.0',
                    onPress: () => Alert.alert('PokéCats', `${t.profile.version} 1.2.0\n\n${t.profile.aboutMessage}`),
                },
            ],
        },
    ], [openSystemSettings, t, router]);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#C13584', '#E1306C', '#F77737']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarGradient}
                        >
                            <View style={[styles.avatarInner, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
                                <Image source={avatarSource} style={styles.avatar} />
                            </View>
                        </LinearGradient>
                    </View>
                    <Text style={[styles.name, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{user.name}</Text>
                    {!!user.role && <Text style={styles.role}>{user.role}</Text>}
                    <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 5 }}>{session?.user?.email}</Text>
                    {!!user.area && (
                        <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 4 }}>
                            {user.area}
                        </Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statColumn}>
                        <StatCard
                            value={user.stats.sightings}
                            label={t.profile.sightings}
                            gradientColors={['#2a69df', '#4dc7ff']}
                        />
                    </View>
                    <View style={styles.statColumn}>
                        <StatCard
                            value={user.stats.fed}
                            label={t.profile.timesFed}
                            gradientColors={['#d8a700', '#f8c109']}
                        />
                    </View>
                    <View style={styles.statColumn}>
                        <StatCard
                            value={user.stats.clips}
                            label={t.profile.clips}
                            gradientColors={['#af4397', '#cf4485']}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{t.profile.preferences}</Text>

                    <VisionOSInlineMenu
                        sections={preferenceSections}
                        style={styles.preferencesMenu}
                    />

                    {/* Toggle controls below menu */}
                    <View style={styles.togglesContainer}>
                        <View style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={styles.toggleInfo}>
                                <Text style={[styles.toggleTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                    {t.profile.notifications}
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {notificationsEnabled ? t.common.enabled : t.common.disabled}
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
                                    {t.profile.locationAccess}
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {locationEnabled ? t.common.enabled : t.common.disabled}
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
                                    {t.profile.darkMode}
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {darkModeEnabled ? t.common.on : t.common.off}
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

                        <Pressable
                            style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                            onPress={handleLanguagePress}
                        >
                            <View style={styles.toggleInfo}>
                                <Text style={[styles.toggleTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                    {t.profile.language}
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                    {language === 'es' ? t.common.spanish : t.common.english}
                                </Text>
                            </View>
                            <Text style={{ color: Colors.primary.blue, fontSize: 15 }}>›</Text>
                        </Pressable>
                    </View>
                </View>

                <GlassButton
                    title={t.profile.logOut}
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
    avatarContainer: {
        marginBottom: 16,
    },
    avatarGradient: {
        width: 132,
        height: 132,
        borderRadius: 66,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 124,
        height: 124,
        borderRadius: 62,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 118,
        height: 118,
        borderRadius: 59,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        // color: Colors.glass.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: Colors.primary.blue,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
        gap: 12,
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statCard: {
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
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
