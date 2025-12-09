import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export default function ProfileScreen() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        })
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Navigation will be handled by the onAuthStateChange in _layout.tsx
    };

    const user = {
        name: session?.user?.email?.split('@')[0] || 'Alex D.',
        role: 'Community Guardian',
        avatar: session?.user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        stats: {
            sightings: 42,
            fed: 156,
            adopted: 2
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                    <Text style={{ color: Colors.glass.textSecondary, marginTop: 5 }}>{session?.user?.email}</Text>
                </View>

                <View style={styles.statsRow}>
                    <GlassView style={styles.statCard} intensity={20}>
                        <Text style={styles.statNumber}>{user.stats.sightings}</Text>
                        <Text style={styles.statLabel}>Sightings</Text>
                    </GlassView>
                    <GlassView style={styles.statCard} intensity={20}>
                        <Text style={styles.statNumber}>{user.stats.fed}</Text>
                        <Text style={styles.statLabel}>Times Fed</Text>
                    </GlassView>
                    <GlassView style={styles.statCard} intensity={20}>
                        <Text style={styles.statNumber}>{user.stats.adopted}</Text>
                        <Text style={styles.statLabel}>Managed</Text>
                    </GlassView>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <GlassView style={styles.menuItem} intensity={30}>
                        <Text style={styles.menuText}>Notifications</Text>
                        <GlassButton icon="bell" style={styles.iconBtn} />
                    </GlassView>
                    <GlassView style={styles.menuItem} intensity={30}>
                        <Text style={styles.menuText}>Location Settings</Text>
                        <GlassButton icon="location" style={styles.iconBtn} />
                    </GlassView>
                    <GlassView style={styles.menuItem} intensity={30}>
                        <Text style={styles.menuText}>Dark Mode</Text>
                        <GlassButton icon="moon.fill" style={styles.iconBtn} />
                    </GlassView>
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
        color: Colors.glass.text,
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
        padding: 16,
        alignItems: 'center',
        borderRadius: 20,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.glass.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.glass.textSecondary,
        textAlign: 'center',
    },
    section: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.glass.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    menuText: {
        fontSize: 16,
        color: Colors.glass.text,
    },
    iconBtn: {
        height: 40,
        width: 40,
        paddingHorizontal: 0,
    },
    logoutBtn: {
        width: '100%',
        borderColor: '#ff4444',
    }
});
