import { CatCard } from '@/components/CatCard';
import { GlassView } from '@/components/ui/GlassView';
import { NativeGlassIconButton } from '@/components/ui/NativeGlassIconButton';
import { Colors } from '@/constants/Colors';
import { Cat } from '@/constants/MockData';
import { useTheme } from '@/context/ThemeContext';
import { getCats } from '@/lib/database';
import * as Location from 'expo-location';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NormalizedCat = Cat & {
    rescueFlags?: string[];
    colorProfile?: string[];
    primaryColor?: string | null;
    pattern?: string | null;
    sex?: string;
};

type SortOption = {
    id: 'distance' | 'lastSeen' | 'needsHelp' | 'notNeutered';
    label: string;
    description: string;
    comparator: (a: NormalizedCat, b: NormalizedCat) => number;
};

const GRID_GAP = 15;
const LIST_PADDING = 20;
const CARD_WIDTH = (Dimensions.get('window').width - LIST_PADDING * 2 - GRID_GAP) / 2;
const DEFAULT_COORDS = { latitude: 25.3712, longitude: 51.5484 }; // Fallback if location unavailable
const SKELETON_ITEMS = Array.from({ length: 6 });

// User location will be stored here and updated dynamically
let userCoords = { ...DEFAULT_COORDS };

const SORT_OPTIONS: SortOption[] = [
    {
        id: 'distance',
        label: 'Distance',
        description: 'Closest cats first',
        comparator: (a, b) => {
            const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
            const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
            return da - db;
        },
    },
    {
        id: 'lastSeen',
        label: 'Last Seen',
        description: 'Most recently sighted first',
        comparator: (a, b) => {
            const ta = getTimestamp(a.lastSighted);
            const tb = getTimestamp(b.lastSighted);
            return tb - ta;
        },
    },
    {
        id: 'needsHelp',
        label: 'Needs Help First',
        description: 'Prioritize urgent cats',
        comparator: (a, b) => {
            const score = (cat: NormalizedCat) => ((cat.status ?? '').toLowerCase() === 'needs help' ? 1 : 0);
            const result = score(b) - score(a);
            if (result !== 0) return result;
            return (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY);
        },
    },
    {
        id: 'notNeutered',
        label: 'Not Neutered First',
        description: 'Surface intact cats',
        comparator: (a, b) => {
            const score = (cat: NormalizedCat) => (cat.tnrStatus === false ? 1 : 0);
            const result = score(b) - score(a);
            if (result !== 0) return result;
            return (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY);
        },
    },
];

export default function DiscoverScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDark } = useTheme();
    const [cats, setCats] = useState<NormalizedCat[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
    const [sortSheetVisible, setSortSheetVisible] = useState(false);
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [locationReady, setLocationReady] = useState(false);
    const shimmerAnimated = useRef(new Animated.Value(0)).current;

    const backgroundColor = isDark ? Colors.primary.dark : Colors.light.background;

    // Fetch user's current location
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced
                    });
                    if (isMounted) {
                        userCoords = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };
                        setLocationReady(true);
                    }
                } else {
                    // Use default coords if permission denied
                    if (isMounted) setLocationReady(true);
                }
            } catch (error) {
                console.error('Failed to get location:', error);
                if (isMounted) setLocationReady(true);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchCats = async () => {
                setLoading(true);
                try {
                    const data = await getCats();
                    if (!isActive) {
                        return;
                    }
                    if (data && data.length) {
                        setCats(data.map((cat) => normalizeCat(cat)));
                    } else {
                        setCats([]);
                    }
                } catch (error) {
                    console.error('Failed to load cats', error);
                    if (isActive) {
                        setCats([]);
                    }
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            fetchCats();

            return () => {
                isActive = false;
            };
        }, [getCats, normalizeCat, locationReady])
    );

    React.useEffect(() => {
        const shimmerLoop = Animated.loop(
            Animated.timing(shimmerAnimated, {
                toValue: 1,
                duration: 1600,
                useNativeDriver: true,
            })
        );
        shimmerLoop.start();
        return () => {
            shimmerLoop.stop();
            shimmerAnimated.setValue(0);
        };
    }, [shimmerAnimated]);

    const filteredCats = useMemo(() => {
        if (!urgentOnly) return cats;
        return cats.filter((cat) => Array.isArray(cat.rescueFlags) && cat.rescueFlags.length > 0);
    }, [cats, urgentOnly]);

    const sortedCats = useMemo(() => {
        const cloned = [...filteredCats];
        cloned.sort(sortOption.comparator);
        return cloned;
    }, [filteredCats, sortOption]);

    const handleSortPress = () => {
        if (Platform.OS === 'ios') {
            setSortSheetVisible(true);
        } else {
            setSortSheetVisible(true);
        }
    };

    const headerSubtitle = `Sorted by ${sortOption.label.toLowerCase()}`;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                {/* Back Button - Native Liquid Glass */}
                <NativeGlassIconButton
                    icon="chevron.left"
                    size={44}
                    iconSize={22}
                    onPress={() => router.back()}
                    accessibilityLabel="Back"
                />

                <Text style={[styles.title, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Nearby Cats</Text>

                {/* Action Buttons - Native Liquid Glass */}
                <View style={styles.headerButtonGroup}>
                    <NativeGlassIconButton
                        icon="plus"
                        size={44}
                        iconSize={20}
                        onPress={() => router.push('/report')}
                        accessibilityLabel="Add Cat"
                    />
                    <NativeGlassIconButton
                        icon="ellipsis"
                        size={44}
                        iconSize={20}
                        onPress={handleSortPress}
                        accessibilityLabel="Sort Options"
                        style={{ marginLeft: 8 }}
                    />
                </View>
            </View>

            <View style={styles.filterRow}>
                <Pressable
                    style={[styles.filterChip, urgentOnly && styles.filterChipActive]}
                    onPress={() => setUrgentOnly((prev) => !prev)}
                >
                    <Text style={[styles.filterChipText, urgentOnly && styles.filterChipTextActive]}>Rescue Flags</Text>
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.skeletonGrid}>
                    {SKELETON_ITEMS.map((_, idx) => (
                        <SkeletonCard key={`skeleton-${idx}`} animatedValue={shimmerAnimated} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={sortedCats}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Link href={`/cat/${item.id}`} asChild>
                            <Pressable style={styles.cardPressable}>
                                <CatCard cat={item} />
                            </Pressable>
                        </Link>
                    )}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 80 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}

            <SortSheet
                visible={sortSheetVisible}
                onClose={() => setSortSheetVisible(false)}
                onSelect={(option) => setSortOption(option)}
                selectedOption={sortOption}
            />
        </View>
    );
}

const SkeletonCard = ({ animatedValue }: { animatedValue: Animated.Value }) => {
    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-CARD_WIDTH, CARD_WIDTH],
    });

    return (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonImage}>
                <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
            </View>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
    );
};

const SortSheet = ({
    visible,
    onClose,
    onSelect,
    selectedOption,
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (option: SortOption) => void;
    selectedOption: SortOption;
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.sheetBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <GlassView style={styles.sheetContent} intensity={80}>
                    <Text style={styles.sheetTitle}>Sort cats</Text>
                    {SORT_OPTIONS.map((option, index) => {
                        const selected = option.id === selectedOption.id;
                        return (
                            <Pressable
                                key={option.id}
                                style={[
                                    styles.sheetOption,
                                    selected && styles.sheetOptionActive,
                                    index > 0 && styles.sheetOptionSpacing,
                                ]}
                                onPress={() => {
                                    onSelect(option);
                                    onClose();
                                }}
                            >
                                <View>
                                    <Text style={styles.sheetOptionLabel}>{option.label}</Text>
                                    <Text style={styles.sheetOptionDescription}>{option.description}</Text>
                                </View>
                                {selected && <SymbolView name="checkmark.circle.fill" tintColor={Colors.primary.green} size={22} />}
                            </Pressable>
                        );
                    })}
                </GlassView>
            </View>
        </Modal>
    );
};

const normalizeCat = (cat: any): NormalizedCat => {
    const distanceMeters = computeDistanceMeters(cat);
    const primaryColor = cat.primaryColor ?? cat.primary_color ?? null;
    const pattern = cat.pattern ?? null;
    const sex = cat.sex ?? 'unknown';

    // Format appearance from color and pattern
    let appearance = 'Mixed';
    if (primaryColor) {
        const colorLabel = primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1);
        appearance = pattern && pattern !== 'unknown'
            ? `${colorLabel} ${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`
            : colorLabel;
    } else if (sex && sex !== 'unknown') {
        appearance = sex.charAt(0).toUpperCase() + sex.slice(1);
    }

    return {
        id: String(cat.id ?? cat.name ?? Math.random()),
        name: cat.name ?? 'Unnamed cat',
        image: cat.image ?? 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
        appearance,
        distance: formatDistanceFromMeters(distanceMeters),
        status: (cat.status ?? 'Healthy') as NormalizedCat['status'],
        description: cat.description ?? '',
        lastFed: cat.lastFed ?? (cat.last_fed ? new Date(cat.last_fed) : undefined),
        lastSighted: cat.lastSighted ?? cat.last_sighted ?? new Date(),
        tnrStatus: cat.tnrStatus ?? cat.tnr_status ?? false,
        timesFed: cat.timesFed ?? (Array.isArray(cat.cat_feedings) ? cat.cat_feedings.length : undefined),
        distanceMeters: distanceMeters ?? undefined,
        isColonyCat: cat.isColonyCat ?? false,
        adoptionStatus: cat.adoptionStatus ?? null,
        rescueFlags: cat.rescueFlags ?? cat.rescue_flags ?? [],
        colorProfile: cat.colorProfile ?? cat.color_profile ?? [],
        primaryColor,
        pattern,
        sex,
    };
};


const getTimestamp = (value?: string | Date | null) => {
    if (!value) return 0;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 0;
    return date.getTime();
};

const computeDistanceMeters = (cat: any) => {
    const latitude = typeof cat.latitude === 'number' ? cat.latitude : typeof cat.lat === 'number' ? cat.lat : null;
    const longitude = typeof cat.longitude === 'number' ? cat.longitude : typeof cat.lon === 'number' ? cat.lon : null;
    if (latitude != null && longitude != null) {
        const earthRadius = 6371000; // meters
        const dLat = deg2rad(latitude - userCoords.latitude);
        const dLon = deg2rad(longitude - userCoords.longitude);
        const lat1 = deg2rad(userCoords.latitude);
        const lat2 = deg2rad(latitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadius * c);
    }
    if (cat.distanceMeters) return cat.distanceMeters;
    return parseDistanceString(cat.distance);
};

const parseDistanceString = (distance?: string) => {
    if (!distance) return null;
    const match = distance.match(/([\d.]+)\s*(km|m)/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value)) return null;
    const unit = match[2].toLowerCase();
    return unit === 'km' ? value * 1000 : value;
};

const formatDistanceFromMeters = (meters?: number | null) => {
    if (!meters) return '—';
    if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const deg2rad = (deg: number) => (deg * Math.PI) / 180;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: LIST_PADDING,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    headerButtonInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        paddingHorizontal: 4,
    },
    headerButtonDivider: {
        width: 1,
        height: 22,
        marginHorizontal: 2,
    },
    headerGroupButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    filterRow: {
        paddingHorizontal: LIST_PADDING,
        paddingBottom: 8,
        flexDirection: 'row',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    filterChipActive: {
        backgroundColor: Colors.primary.green,
    },
    filterChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
        fontSize: 13,
    },
    filterChipTextActive: {
        color: '#021206',
    },
    listContent: {
        paddingHorizontal: LIST_PADDING,
        paddingTop: 4,
        paddingBottom: GRID_GAP,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: GRID_GAP,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: LIST_PADDING,
        paddingTop: 10,
        paddingBottom: GRID_GAP,
    },
    skeletonCard: {
        width: CARD_WIDTH,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 16,
        overflow: 'hidden',
        marginBottom: GRID_GAP,
    },
    skeletonImage: {
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    skeletonLine: {
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        marginTop: 12,
        marginHorizontal: 16,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: CARD_WIDTH / 2,
        backgroundColor: 'rgba(255,255,255,0.18)',
        opacity: 0.8,
    },
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
        padding: 20,
    },
    sheetContent: {
        borderRadius: 24,
        padding: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.glass.text,
        marginBottom: 4,
    },
    sheetOption: {
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    sheetOptionActive: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    sheetOptionLabel: {
        color: Colors.glass.text,
        fontSize: 16,
        fontWeight: '600',
    },
    sheetOptionDescription: {
        color: Colors.glass.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    sheetOptionSpacing: {
        marginTop: 8,
    },
    cardPressable: {
        width: CARD_WIDTH,
    },
});
