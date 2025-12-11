import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { getCatStatusState } from '@/lib/cat_logic';
import { addFeeding, getCat } from '@/lib/database';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80';

export default function CatDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

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
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={Colors.primary.green} />
                <Text style={[styles.loadingText, { color: theme.icon }]}>Loading cat profile…</Text>
            </View>
        );
    }

    if (error || !cat) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={styles.errorText}>{error ?? 'Cat not found'}</Text>
            </View>
        );
    }

    const handleFeed = async () => {
        if (!cat) return;
        try {
            const timestamp = new Date().toISOString();
            await addFeeding(Number(cat.id), 'Dry Food', 'Bowl', false);
            // addFeeding already updates last_fed in DB

            // Optimistic update
            const updatedCat = {
                ...cat,
                lastFed: new Date(timestamp),
                timesFed: (cat.timesFed || 0) + 1
            };
            setCat(updatedCat);
            Alert.alert('Thank you!', 'Feeding recorded.');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not record feeding.');
        }
    };

    const statusState = cat ? getCatStatusState(cat) : { statusText: 'Loading', statusColor: '#ccc', labelColor: '#000' };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: '',
                    headerTransparent: true,
                    headerTintColor: Colors.primary.green,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image source={{ uri: cat.image || FALLBACK_IMAGE }} style={styles.image} />
                <View style={[styles.contentContainer, { backgroundColor: theme.background, shadowColor: isDark ? '#000' : '#ccc' }]}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.name, { color: theme.text }]}>{cat.name}</Text>
                            <Text style={[styles.subtitle, { color: theme.icon }]}>{cat.breed || 'Community cat'}</Text>
                        </View>
                        <View style={styles.badgeGroup}>
                            <View style={[styles.statusBadge, { backgroundColor: statusState.statusColor }]}>
                                <Text style={[styles.statusBadgeText, { color: statusState.labelColor }]}>{statusState.statusText}</Text>
                            </View>
                            {cat.tnrStatus && (
                                <View style={[styles.statusBadge, styles.statusBadgeSafe]}>
                                    <Text style={[styles.statusBadgeText, { color: Colors.primary.blue }]}>TNR’d</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <Text style={[styles.locationDescription, { color: theme.icon }]}>
                        {cat.locationDescription ?? 'Location shared by the community'}
                    </Text>

                    {cat.rescueFlags?.length ? (
                        <View style={styles.flagWrap}>
                            {cat.rescueFlags.map((flag: string) => (
                                <View key={flag} style={styles.flagChip}>
                                    <Text style={[styles.flagChipText, { color: theme.text }]}>{formatFlag(flag)}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.statsGrid}>
                        <ProfileStat label="Times Fed" value={`${cat.timesFed ?? 0}`} color={theme.text} labelColor={theme.icon} />
                        <ProfileStat label="Last Fed" value={formatTimeAgo(cat.lastFed)} color={theme.text} labelColor={theme.icon} />
                        <ProfileStat label="Last Seen" value={formatTimeAgo(cat.lastSighted)} color={theme.text} labelColor={theme.icon} />
                        <ProfileStat label="TNR Status" value={cat.tnrStatus ? 'Sterilized' : 'Intact'} color={theme.text} labelColor={theme.icon} />
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.text }]}>About this cat</Text>
                    <Text style={[styles.description, { color: theme.icon }]}>{cat.description ?? 'No description has been added yet.'}</Text>

                    <View style={styles.actions}>
                        <GlassButton title="I fed this cat" icon="heart.fill" variant="secondary" style={styles.compactBtn} onPress={handleFeed} />
                        <Link href={`/cat/${id}/translate`} asChild>
                            <GlassButton title="Translate" icon="mic.fill" variant="primary" style={styles.compactBtn} />
                        </Link>
                        <Link href={`/cat/${id}/edit`} asChild>
                            <GlassButton title="Update Status" icon="pencil" style={styles.compactBtn} />
                        </Link>
                    </View>
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

const ProfileStat = ({ label, value, color, labelColor }: { label: string; value: string; color: string; labelColor: string }) => (
    <View style={styles.profileStat}>
        <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 16,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: '#eee',
    },
    contentContainer: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 0,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    badgeGroup: {
        flexDirection: 'row',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statusBadgeAlert: {
        backgroundColor: 'rgba(255,107,107,0.1)',
        borderColor: 'rgba(255,107,107,0.2)',
    },
    statusBadgeOk: {
        backgroundColor: 'rgb(133, 229, 105)',
    },
    statusBadgeSafe: {
        backgroundColor: 'rgba(63, 143, 247, 0.1)',
        borderColor: 'rgba(63, 143, 247, 0.2)',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    locationDescription: {
        fontSize: 14,
        marginBottom: 16,
    },
    flagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    flagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    flagChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 24,
    },
    profileStat: {
        width: '45%',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 24,
    },
    actions: {
        gap: 12,
    },
    compactBtn: {
        height: 44,
        width: '100%',
    },
});
