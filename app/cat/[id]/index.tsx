import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { NativeGlassIconButton } from '@/components/ui/NativeGlassIconButton';
import { getColorLabel, getPatternLabel } from '@/constants/CatAppearance';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { getCatStatusState } from '@/lib/cat_logic';
import { addFeeding, getCat, updateCat, uploadCatImage } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80';

// Alert priority configuration
const ALERT_CONFIG: Record<string, { icon: string; color: string; priority: 'red' | 'amber' | 'neutral' }> = {
    pregnant: { icon: 'heart.fill', color: '#F59E0B', priority: 'amber' },
    injured: { icon: 'bandage.fill', color: '#EF4444', priority: 'red' },
    sick: { icon: 'cross.case.fill', color: '#EF4444', priority: 'red' },
    'not-neutered': { icon: 'exclamationmark.triangle.fill', color: '#F59E0B', priority: 'amber' },
    'not-seen-48h': { icon: 'eye.slash.fill', color: '#F59E0B', priority: 'amber' },
    'food-needed': { icon: 'fork.knife', color: '#F59E0B', priority: 'amber' },
    'in-danger': { icon: 'exclamationmark.octagon.fill', color: '#EF4444', priority: 'red' },
    hungry: { icon: 'fork.knife', color: '#F59E0B', priority: 'amber' },
    scared: { icon: 'exclamationmark.triangle.fill', color: '#F59E0B', priority: 'amber' },
};

export default function CatDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = isDark ? Colors.dark : Colors.light;
    const { width: SCREEN_WIDTH } = Dimensions.get('window');

    const [cat, setCat] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [quickUpdateModalOpen, setQuickUpdateModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

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
            return () => { isMounted = false; };
        }, [id])
    );

    const handleFeed = async () => {
        if (!cat || actionLoading) return;
        try {
            setActionLoading(true);
            const timestamp = new Date().toISOString();
            await addFeeding(Number(cat.id), 'Dry Food', 'Bowl', false);
            setCat({
                ...cat,
                lastFed: new Date(timestamp),
                timesFed: (cat.timesFed || 0) + 1
            });
            Alert.alert('Thank you!', 'Feeding recorded.');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not record feeding.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportIssue = async (issue: string) => {
        if (!cat || actionLoading) return;
        try {
            setActionLoading(true);
            const currentFlags = cat.rescueFlags || [];
            const newFlags = currentFlags.includes(issue) ? currentFlags : [...currentFlags, issue];
            await updateCat(Number(cat.id), {
                rescueFlags: newFlags,
                status: issue === 'injured' || issue === 'sick' ? 'Needs Help' : cat.status,
            });
            setCat({ ...cat, rescueFlags: newFlags });
            setReportModalOpen(false);
            Alert.alert('Report submitted', 'Thank you for helping this cat.');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not submit report.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickUpdate = async (action: string) => {
        if (!cat || actionLoading) return;
        try {
            setActionLoading(true);
            if (action === 'seen') {
                await updateCat(Number(cat.id), { lastSighted: new Date().toISOString() });
                setCat({ ...cat, lastSighted: new Date() });
                Alert.alert('Updated', 'Sighting recorded.');
            }
            setQuickUpdateModalOpen(false);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not update.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddPhoto = async () => {
        setQuickUpdateModalOpen(false);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (result.canceled || !result.assets[0]) return;

            setActionLoading(true);
            const uploadedUrl = await uploadCatImage(result.assets[0].uri);
            if (uploadedUrl) {
                const currentPhotos = cat.photos || [];
                const newPhotos = [...currentPhotos, uploadedUrl];
                await updateCat(Number(cat.id), { photos: newPhotos });
                setCat({ ...cat, photos: newPhotos });
                Alert.alert('Success', 'Photo added to gallery!');
            } else {
                Alert.alert('Error', 'Failed to upload photo.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not add photo.');
        } finally {
            setActionLoading(false);
        }
    };

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

    const statusState = getCatStatusState(cat);
    const alerts = getActiveAlerts(cat);
    const feedingStatus = getFeedingStatus(cat.lastFed);

    // Debug: Log cat image
    console.log('🐱 Cat image URL:', cat.image);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 200 }]}
            >
                {/* Header Image with Gradient */}
                <View style={styles.imageContainer}>
                    {(() => {
                        const allPhotos = [cat.image, ...(cat.photos || [])].filter(url => url && url.startsWith('http'));
                        const photosToDisplay = allPhotos.length > 0 ? allPhotos : [FALLBACK_IMAGE];

                        return (
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                bounces={false}
                            >
                                {photosToDisplay.map((img, i) => (
                                    <Image
                                        key={i}
                                        source={{ uri: img }}
                                        style={[styles.image, { width: SCREEN_WIDTH }]}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                        );
                    })()}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.imageGradient}
                    />
                    {/* Back Button - Native Liquid Glass */}
                    <View style={[styles.backButton, { top: insets.top + 10 }]}>
                        <NativeGlassIconButton
                            icon="chevron.left"
                            size={44}
                            iconSize={22}
                            onPress={() => router.back()}
                            accessibilityLabel="Back"
                        />
                    </View>
                </View>

                {/* Content Container */}
                <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
                    {/* Identity Row */}
                    <View style={styles.identityRow}>
                        <View style={styles.identityLeft}>
                            <Text style={[styles.catName, { color: theme.text }]}>{cat.name || 'Unnamed'}</Text>
                            <Text style={[styles.catSex, { color: theme.icon }]}>
                                {formatCatSubtitle(cat)}
                            </Text>
                        </View>
                        <View style={[styles.healthBadge, { backgroundColor: statusState.statusColor }]}>
                            <Text style={[styles.healthBadgeText, { color: statusState.labelColor }]}>
                                {statusState.statusText}
                            </Text>
                        </View>
                    </View>

                    {/* Needs & Alerts Section */}
                    {alerts.length > 0 && (
                        <View style={styles.alertsSection}>
                            <View style={styles.alertPills}>
                                {alerts.map((alert) => (
                                    <View
                                        key={alert.key}
                                        style={[styles.alertPill, { backgroundColor: `${alert.color}20`, borderColor: alert.color }]}
                                    >
                                        <SymbolView name={alert.icon as any} size={14} tintColor={alert.color} />
                                        <Text style={[styles.alertPillText, { color: alert.color }]}>{alert.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Key Status Grid */}
                    <View style={styles.statusGrid}>
                        <StatusItem
                            icon="fork.knife"
                            label="Last Fed"
                            value={formatTimeAgo(cat.lastFed)}
                            theme={theme}
                            isDark={isDark}
                        />
                        <StatusItem
                            icon="leaf.fill"
                            label="Feeding Status"
                            value={feedingStatus.text}
                            valueColor={feedingStatus.color}
                            theme={theme}
                            isDark={isDark}
                        />
                        <StatusItem
                            icon="eye.fill"
                            label="Last Seen"
                            value={formatTimeAgo(cat.lastSighted)}
                            theme={theme}
                            isDark={isDark}
                        />
                        <StatusItem
                            icon="shield.fill"
                            label="TNR Status"
                            value={cat.tnrStatus ? 'Neutered' : 'Intact'}
                            valueColor={cat.tnrStatus ? Colors.primary.green : '#F59E0B'}
                            theme={theme}
                            isDark={isDark}
                        />
                    </View>

                    {/* Community Presence */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Community</Text>
                        <View style={[styles.communityCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={styles.communityRow}>
                                <SymbolView name="eye.fill" size={16} tintColor={Colors.primary.green} />
                                <Text style={[styles.communityText, { color: theme.text }]}>
                                    {cat.timesFed || 0} community members check on this cat
                                </Text>
                            </View>
                            <View style={styles.communityRow}>
                                <SymbolView name="person.fill" size={16} tintColor={theme.icon} />
                                <Text style={[styles.communityText, { color: theme.icon }]}>
                                    {cat.assignedCaregiverId ? 'Primary guardian nearby' : 'No assigned guardian'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Location Context */}
                    {cat.locationDescription && (
                        <View style={styles.section}>
                            <View style={[styles.locationCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <SymbolView name="mappin.circle.fill" size={18} tintColor={Colors.primary.green} />
                                <Text style={[styles.locationText, { color: theme.text }]}>{cat.locationDescription}</Text>
                            </View>
                        </View>
                    )}

                    {/* About This Cat */}
                    {cat.description && cat.description.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>About this cat</Text>
                            <Text style={[styles.aboutText, { color: theme.icon }]} numberOfLines={4}>
                                {cat.description.slice(0, 140)}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View style={[styles.stickyActions, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background }]}>
                <GlassButton
                    title={actionLoading ? 'Saving...' : 'I fed this cat'}
                    icon="checkmark.circle.fill"
                    variant="primary"
                    onPress={handleFeed}
                    disabled={actionLoading}
                    style={styles.primaryActionButton}
                />

                {/* Secondary Actions - Text Links */}
                <View style={styles.textLinksRow}>
                    <Pressable
                        onPress={() => setReportModalOpen(true)}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                        <Text style={[styles.textLink, { color: Colors.primary.green }]}>Report an issue</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setQuickUpdateModalOpen(true)}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                        <Text style={[styles.textLink, { color: Colors.primary.blue }]}>Quick Update</Text>
                    </Pressable>
                </View>
            </View>

            {/* Report Issue Modal */}
            <Modal
                visible={reportModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setReportModalOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setReportModalOpen(false)} />
                <View style={styles.modalSheet}>
                    <GlassView style={[styles.modalCard, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]} intensity={isDark ? 40 : 0}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Report an Issue</Text>
                            <Pressable onPress={() => setReportModalOpen(false)}>
                                <Text style={{ color: Colors.primary.blue, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                        </View>
                        <View style={styles.modalOptions}>
                            {['injured', 'sick', 'missing', 'in-danger', 'other'].map((issue) => (
                                <Pressable
                                    key={issue}
                                    onPress={() => handleReportIssue(issue)}
                                    style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                                >
                                    <Text style={[styles.modalOptionText, { color: theme.text }]}>
                                        {issue.charAt(0).toUpperCase() + issue.slice(1).replace('-', ' ')}
                                    </Text>
                                    <SymbolView name="chevron.right" size={16} tintColor={theme.icon} />
                                </Pressable>
                            ))}
                        </View>
                    </GlassView>
                </View>
            </Modal>

            {/* Quick Update Modal */}
            <Modal
                visible={quickUpdateModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setQuickUpdateModalOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setQuickUpdateModalOpen(false)} />
                <View style={styles.modalSheet}>
                    <GlassView style={[styles.modalCard, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]} intensity={isDark ? 40 : 0}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Quick Update</Text>
                            <Pressable onPress={() => setQuickUpdateModalOpen(false)}>
                                <Text style={{ color: Colors.primary.blue, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                        </View>
                        <View style={styles.modalOptions}>
                            <Pressable
                                onPress={() => handleQuickUpdate('seen')}
                                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                            >
                                <Text style={[styles.modalOptionText, { color: theme.text }]}>Seen now</Text>
                                <SymbolView name="eye.fill" size={18} tintColor={Colors.primary.green} />
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setQuickUpdateModalOpen(false);
                                    router.push(`/cat/${id}/edit`);
                                }}
                                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                            >
                                <Text style={[styles.modalOptionText, { color: theme.text }]}>Condition changed</Text>
                                <SymbolView name="pencil" size={18} tintColor={theme.icon} />
                            </Pressable>
                            <Pressable
                                onPress={() => handleAddPhoto()}
                                style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]}
                            >
                                <Text style={[styles.modalOptionText, { color: theme.text }]}>Add photo</Text>
                                <SymbolView name="camera.fill" size={18} tintColor={Colors.primary.blue} />
                            </Pressable>
                        </View>
                    </GlassView>
                </View>
            </Modal>
        </View>
    );
}

// Helper Components
const StatusItem = ({ icon, label, value, valueColor, theme, isDark }: {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
    theme: any;
    isDark: boolean;
}) => (
    <View style={[styles.statusItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <SymbolView name={icon as any} size={16} tintColor={theme.icon} />
        <Text style={[styles.statusLabel, { color: theme.icon }]}>{label}</Text>
        <Text style={[styles.statusValue, { color: valueColor || theme.text }]}>{value}</Text>
    </View>
);

// Helper Functions
const formatCatSubtitle = (cat: any): string => {
    const parts: string[] = [];

    // Add color info
    if (cat.primaryColor || cat.primary_color) {
        parts.push(getColorLabel(cat.primaryColor || cat.primary_color));
    }

    // Add pattern info
    const pattern = cat.pattern;
    if (pattern && pattern !== 'unknown') {
        parts.push(getPatternLabel(pattern));
    }

    // Add sex info
    const sex = cat.sex;
    if (sex && sex !== 'unknown') {
        parts.push(sex.charAt(0).toUpperCase() + sex.slice(1));
    }

    if (parts.length === 0) {
        return 'Unknown';
    }

    return parts.join(' • ');
};

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

const getFeedingStatus = (lastFed?: string | Date | null): { text: string; color: string } => {
    if (!lastFed) return { text: 'Unknown', color: '#888' };
    const date = typeof lastFed === 'string' ? new Date(lastFed) : lastFed;
    if (!(date instanceof Date) || isNaN(date.getTime())) return { text: 'Unknown', color: '#888' };
    const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 4) return { text: 'Recently fed', color: Colors.primary.blue };
    if (hoursAgo < 12) return { text: 'May need food', color: '#F59E0B' };
    return { text: 'Likely hungry', color: '#EF4444' };
};

const getActiveAlerts = (cat: any): { key: string; label: string; icon: string; color: string }[] => {
    const alerts: { key: string; label: string; icon: string; color: string }[] = [];

    // Check rescue flags
    const flags = cat.rescueFlags || [];
    flags.forEach((flag: string) => {
        const config = ALERT_CONFIG[flag.toLowerCase()];
        if (config) {
            alerts.push({
                key: flag,
                label: flag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                icon: config.icon,
                color: config.color,
            });
        }
    });

    // Check if not neutered
    if (!cat.tnrStatus) {
        alerts.push({
            key: 'not-neutered',
            label: 'Not Neutered',
            icon: 'exclamationmark.triangle.fill',
            color: '#F59E0B',
        });
    }

    // Check if not seen in 48h
    if (cat.lastSighted) {
        const lastSeen = typeof cat.lastSighted === 'string' ? new Date(cat.lastSighted) : cat.lastSighted;
        if (lastSeen instanceof Date && !isNaN(lastSeen.getTime())) {
            const hoursAgo = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
            if (hoursAgo > 48) {
                alerts.push({
                    key: 'not-seen-48h',
                    label: 'Not seen in the last 2 days',
                    icon: 'eye.slash.fill',
                    color: '#F59E0B',
                });
            }
        }
    }

    return alerts;
};

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 4 / 3,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    identityLeft: {
        flex: 1,
    },
    catName: {
        fontSize: 26,
        fontWeight: '700',
    },
    catSex: {
        fontSize: 14,
        marginTop: 4,
    },
    healthBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    healthBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    alertsSection: {
        marginBottom: 20,
    },
    alertPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    alertPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    alertPillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    statusItem: {
        width: '48%',
        padding: 14,
        borderRadius: 14,
        gap: 6,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    communityCard: {
        padding: 14,
        borderRadius: 14,
        gap: 10,
    },
    communityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    communityText: {
        fontSize: 14,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 14,
    },
    locationText: {
        flex: 1,
        fontSize: 14,
    },
    aboutText: {
        fontSize: 14,
        lineHeight: 22,
    },
    stickyActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.2)',
        alignItems: 'center',
    },
    primaryActionButton: {
        width: '100%',
    },
    textLinksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        paddingVertical: 4,
    },
    textLink: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalCard: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    modalOptions: {
        paddingBottom: 40,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.1)',
    },
    modalOptionText: {
        fontSize: 16,
    },
});
