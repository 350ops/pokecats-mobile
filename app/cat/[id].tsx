import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { getCat } from '@/lib/database';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80';

export default function CatDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [cat, setCat] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const fetchCat = async () => {
                if (!id) return;
                setLoading(true);
                setError(null);
                try {
                    const record = await getCat(Number(id));
                    if (!isMounted) return;
                    if (!record) {
                        setError('Cat not found');
                    }
                    setCat(record);
                } catch (err: any) {
                    console.error(err);
                    if (isMounted) setError('Unable to load cat details right now.');
                } finally {
                    if (isMounted) setLoading(false);
                }
            };
            fetchCat();
            return () => {
                isMounted = false;
            };
        }, [id])
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary.green} />
                <Text style={styles.loadingText}>Loading cat profile…</Text>
            </View>
        );
    }

    if (error || !cat) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error ?? 'Cat not found'}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: cat.name,
                    headerTransparent: true,
                    headerTintColor: 'white',
                    headerBlurEffect: 'dark',
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image source={{ uri: cat.image || FALLBACK_IMAGE }} style={styles.image} />
                <View style={styles.contentContainer}>
                    <GlassView style={styles.detailsCard} intensity={40}>
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{cat.name}</Text>
                                <Text style={styles.subtitle}>{cat.breed || 'Community cat'}</Text>
                            </View>
                            <View style={styles.badgeGroup}>
                                <View style={[styles.statusBadge, (cat.status ?? '').toLowerCase() === 'needs help' && styles.statusBadgeAlert]}>
                                    <Text style={styles.statusBadgeText}>{cat.status ?? 'Unknown'}</Text>
                                </View>
                                {cat.tnrStatus && (
                                    <View style={[styles.statusBadge, styles.statusBadgeSafe]}>
                                        <Text style={styles.statusBadgeText}>TNR’d</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={styles.locationDescription}>
                            {cat.locationDescription ?? 'Location shared by the community'}
                        </Text>

                        {cat.rescueFlags?.length ? (
                            <View style={styles.flagWrap}>
                                {cat.rescueFlags.map((flag: string) => (
                                    <View key={flag} style={styles.flagChip}>
                                        <Text style={styles.flagChipText}>{formatFlag(flag)}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.statsGrid}>
                            <ProfileStat label="Times Fed" value={`${cat.timesFed ?? 0}`} />
                            <ProfileStat label="Last Fed" value={formatTimeAgo(cat.lastFed)} />
                            <ProfileStat label="Last Seen" value={formatTimeAgo(cat.lastSighted)} />
                            <ProfileStat label="TNR Status" value={cat.tnrStatus ? 'Sterilized' : 'Intact'} />
                        </View>

                        <Text style={styles.sectionTitle}>About this cat</Text>
                        <Text style={styles.description}>{cat.description ?? 'No description has been added yet.'}</Text>

                        <View style={styles.actions}>
                            <Link href={`/cat/${id}/translate`} asChild>
                                <GlassButton title="Translate Meow" icon="mic.fill" variant="primary" style={styles.actionBtn} />
                            </Link>
                            <GlassButton title="I fed this cat" icon="heart.fill" variant="secondary" style={styles.actionBtn} />
                            <GlassButton title="Update Status" icon="pencil" style={styles.actionBtn} />
                        </View>
                    </GlassView>
                </View>
            </ScrollView>
        </View>
    );
}

const formatTimeAgo = (value?: string | Date | null) => {
    if (!value) return 'Unknown';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Unknown';
    const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.round(diffMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const formatFlag = (flag: string) => flag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ProfileStat = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.profileStat}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    centered: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        color: Colors.glass.text,
        fontSize: 16,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    image: {
        width: '100%',
        height: 380,
        backgroundColor: '#333',
    },
    contentContainer: {
        marginTop: -60,
        paddingHorizontal: 20,
    },
    detailsCard: {
        padding: 24,
        borderRadius: 32,
        gap: 18,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    name: {
        fontSize: 30,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.glass.textSecondary,
        marginTop: 4,
    },
    badgeGroup: {
        flexDirection: 'row',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    statusBadgeAlert: {
        backgroundColor: 'rgba(255,107,107,0.2)',
    },
    statusBadgeSafe: {
        backgroundColor: 'rgba(103,206,103,0.2)',
    },
    statusBadgeText: {
        color: Colors.glass.text,
        fontSize: 12,
        fontWeight: '600',
    },
    locationDescription: {
        color: Colors.glass.textSecondary,
        fontSize: 14,
    },
    flagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    flagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    flagChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    profileStat: {
        width: '46%',
    },
    statLabel: {
        fontSize: 13,
        color: Colors.glass.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.glass.text,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.glass.text,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.glass.textSecondary,
    },
    actions: {
        gap: 12,
        marginTop: 12,
    },
    actionBtn: {
        width: '100%',
    },
});
