import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { addFeeding, getCats, updateCat } from '@/lib/database';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Alert, Dimensions, FlatList, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapCat = {
    id: number;
    name: string;
    image?: string;
    breed?: string;
    status?: string;
    latitude: number;
    longitude: number;
    lastFed?: string | Date | null;
    lastSighted?: string | Date | null;
    tnrStatus?: boolean;
    timesFed?: number;
    assignedCaregiverId?: number | null;
    assigned_caregiver_id?: number | null;
    caregiverId?: number | null;
    rescueFlags?: string[];
    colorProfile?: string[];
    locationDescription?: string | null;
};

type FilterDefinition = {
    id: string;
    label: string;
    predicate: (cat: MapCat) => boolean;
};

const CURRENT_USER_ID = 42;
const CARD_HORIZONTAL_MARGIN = 20;
const CARD_SPACING = 12;
const CARD_WIDTH = Dimensions.get('window').width - CARD_HORIZONTAL_MARGIN * 2;
const CAROUSEL_BOTTOM_OFFSET = 110;
const CAT_FALLBACK = require('@/assets/images/cat-placeholder.jpg');

const INITIAL_REGION: Region = {
    latitude: 25.3712,
    longitude: 51.5484,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

const FILTERS: FilterDefinition[] = [
    {
        id: 'needs-help',
        label: 'Needs Help',
        predicate: (cat) => (cat.status ?? '').toLowerCase() === 'needs help',
    },
    {
        id: 'not-neutered',
        label: 'Not Neutered',
        predicate: (cat) => cat.tnrStatus === false,
    },
    {
        id: 'recently-seen',
        label: 'Recently Seen',
        predicate: (cat) => isRecentlySeen(cat.lastSighted),
    },
    {
        id: 'my-cats',
        label: 'My Cats',
        predicate: (cat) => isCatAssignedToUser(cat, CURRENT_USER_ID),
    },
    {
        id: 'urgent',
        label: 'Rescue Flags',
        predicate: (cat) => Array.isArray(cat.rescueFlags) && cat.rescueFlags.length > 0,
    },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<MapCat>);

export default function MapScreen() {
    const { isDark, colorScheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [cats, setCats] = useState<MapCat[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
    const [feedingCatId, setFeedingCatId] = useState<number | null>(null);
    const [statusUpdatingCatId, setStatusUpdatingCatId] = useState<number | null>(null);
    const mapRef = useRef<MapView | null>(null);
    const carouselRef = useRef<FlatList<MapCat>>(null);
    const jitterCacheRef = useRef<Map<number, { latitude: number; longitude: number }>>(new Map());
    const scrollX = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const fetchCats = async () => {
                const data = await getCats();
                if (!isMounted) return;
                setCats(data as MapCat[]);
                setSelectedCatId((prev) => {
                    if (prev !== null && prev !== undefined) return prev;
                    return data.length ? Number(data[0].id) : null;
                });
            };
            fetchCats();
            return () => {
                isMounted = false;
            };
        }, [])
    );

    const filteredCats = useMemo(() => {
        if (!activeFilters.size) return cats;
        return cats.filter((cat) => {
            for (const filterId of activeFilters) {
                const filterDef = FILTERS.find((f) => f.id === filterId);
                if (filterDef && !filterDef.predicate(cat)) {
                    return false;
                }
            }
            return true;
        });
    }, [cats, activeFilters]);

    useEffect(() => {
        if (!filteredCats.length) {
            setSelectedCatId(null);
            return;
        }
        if (!selectedCatId || !filteredCats.some((cat) => cat.id === selectedCatId)) {
            setSelectedCatId(filteredCats[0].id);
            carouselRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [filteredCats, selectedCatId]);

    const selectedCat = selectedCatId ? filteredCats.find((cat) => cat.id === selectedCatId) ?? null : null;

    const toggleFilter = (filterId: string) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(filterId)) {
                next.delete(filterId);
            } else {
                next.add(filterId);
            }
            return next;
        });
    };

    const getDisplayCoordinate = useCallback(
        (cat: MapCat) => {
            if (isCatAssignedToUser(cat, CURRENT_USER_ID)) {
                jitterCacheRef.current.delete(cat.id);
                return { coordinate: { latitude: cat.latitude, longitude: cat.longitude }, precise: true };
            }
            if (!jitterCacheRef.current.has(cat.id)) {
                jitterCacheRef.current.set(cat.id, jitterCoordinate(cat.latitude, cat.longitude));
            }
            const coordinate = jitterCacheRef.current.get(cat.id)!;
            return { coordinate, precise: false };
        },
        []
    );

    const focusMapOnCat = useCallback(
        (cat: MapCat) => {
            if (!mapRef.current) return;
            const { coordinate } = getDisplayCoordinate(cat);
            mapRef.current.animateToRegion(
                {
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                260
            );
        },
        [getDisplayCoordinate]
    );

    useEffect(() => {
        if (selectedCat) {
            focusMapOnCat(selectedCat);
        }
    }, [selectedCat, focusMapOnCat]);

    if (Platform.OS === 'web') {
        return (
            <View style={styles.webFallback}>
                <Text style={{ color: 'white' }}>Map not supported on web yet</Text>
            </View>
        );
    }

    const getFedStatusColor = (dateValue?: string | Date | null) => {
        if (!dateValue) return Colors.glass.textSecondary;
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        if (!(date instanceof Date) || isNaN(date.getTime())) return Colors.glass.textSecondary;
        const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
        if (hours < 4) return Colors.primary.green;
        if (hours > 12) return '#FF6B6B';
        return Colors.primary.yellow;
    };

    const handleFeedCat = async (cat: MapCat) => {
        setFeedingCatId(cat.id);
        try {
            const timestamp = new Date().toISOString();
            await Promise.all([
                addFeeding(cat.id, 'Quick Feed', 'Snack', false),
                updateCat(cat.id, { lastFed: timestamp }),
            ]);
            setCats((prev) =>
                prev.map((item) =>
                    item.id === cat.id
                        ? {
                              ...item,
                              lastFed: new Date(timestamp),
                              timesFed: (item.timesFed ?? 0) + 1,
                          }
                        : item
                )
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Unable to log feeding', 'Please try again in a moment.');
        } finally {
            setFeedingCatId(null);
        }
    };

    const handleStatusUpdate = async (cat: MapCat, nextStatus: string) => {
        setStatusUpdatingCatId(cat.id);
        try {
            await updateCat(cat.id, { status: nextStatus });
            setCats((prev) =>
                prev.map((item) => (item.id === cat.id ? { ...item, status: nextStatus } : item))
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Unable to update status', 'Please try again shortly.');
        } finally {
            setStatusUpdatingCatId(null);
        }
    };

    const promptNeedsHelp = (cat: MapCat) => {
        const isFlagged = (cat.status ?? '').toLowerCase() === 'needs help';
        Alert.alert(
            isFlagged ? 'Clear Needs Help Flag' : 'Flag for Help',
            isFlagged
                ? 'Mark this cat as stable again?'
                : 'Mark this cat as needing assistance or file an injury report.',
            [
                {
                    text: isFlagged ? 'Mark Healthy' : 'Mark Needs Help',
                    onPress: () => handleStatusUpdate(cat, isFlagged ? 'Healthy' : 'Needs Help'),
                },
                {
                    text: 'Report Injury',
                    onPress: () =>
                        router.push({
                            pathname: '/modal',
                            params: { catId: String(cat.id) },
                        }),
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleNavigate = (cat: MapCat) => {
        const preciseAccess = isCatAssignedToUser(cat, CURRENT_USER_ID);
        const target = preciseAccess ? { latitude: cat.latitude, longitude: cat.longitude } : getDisplayCoordinate(cat).coordinate;
        const label = encodeURIComponent(cat.name ?? 'Stray Cat');
        const lat = target.latitude;
        const lon = target.longitude;
        const url =
            Platform.select({
                ios: `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`,
                android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
                default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
            }) ?? '';
        Linking.openURL(url).catch(() => Alert.alert('Unable to open maps'));
    };

    const handleMarkerPress = (cat: MapCat) => {
        setSelectedCatId(cat.id);
        const index = filteredCats.findIndex((item) => item.id === cat.id);
        if (index >= 0) {
            carouselRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    const onCarouselMomentumEnd = (event: any) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / (CARD_WIDTH + CARD_SPACING));
        const cat = filteredCats[index];
        if (cat && cat.id !== selectedCatId) {
            setSelectedCatId(cat.id);
        }
    };

    const catCountLabel = activeFilters.size ? `${filteredCats.length} cats match filters` : `${cats.length} cats nearby`;

    const renderCarouselItem = ({ item, index }: { item: MapCat; index: number }) => {
        const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
        ];
        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
        });
        const { precise } = getDisplayCoordinate(item);
        const isLast = index === filteredCats.length - 1;
        return (
            <Animated.View
                style={{
                    width: CARD_WIDTH,
                    transform: [{ scale }],
                    marginRight: isLast ? 0 : CARD_SPACING,
                }}
            >
                <GlassView intensity={80} style={styles.cardShell}>
                    <Pressable onPress={() => router.push(`/cat/${item.id}`)} style={{ flex: 1 }}>
                        <View style={styles.cardHeader}>
                            <Image
                                source={item.image ? { uri: item.image } : CAT_FALLBACK}
                                style={styles.avatar}
                            />
                            <View style={{ flex: 1 }}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={[styles.catName, { color: isDark ? Colors.glass.text : Colors.light.text }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        (item.status ?? '').toLowerCase() === 'needs help' ? styles.statusBadgeAlert : styles.statusBadgeOk
                                    ]}>
                                        <Text style={styles.statusBadgeText}>{item.status ?? 'Unknown'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.catBreed, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]} numberOfLines={1}>
                                    {item.breed ?? 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.locationRow}>
                            <SymbolView
                                name={precise ? 'lock.open.fill' : 'lock.fill'}
                                tintColor={precise ? Colors.primary.green : Colors.primary.yellow}
                                size={18}
                            />
                            <Text style={[styles.locationLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                {catLocationCopy(item, precise)}
                            </Text>
                        </View>

                        {item.rescueFlags?.length ? (
                            <View style={styles.flagRow}>
                                {item.rescueFlags.slice(0, 2).map((flag) => (
                                    <View key={flag} style={styles.flagChip}>
                                        <Text style={styles.flagChipText}>{flag}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.statsBlock}>
                            <StatRow
                                icon="fork.knife"
                                label="Last Fed"
                                value={getTimeAgo(item.lastFed)}
                                tint={getFedStatusColor(item.lastFed)}
                            />
                            <StatRow
                                icon="number.square"
                                label="Times Fed"
                                value={`${item.timesFed ?? 0}`}
                                tint={Colors.primary.green}
                            />
                            <StatRow
                                icon="eye.fill"
                                label="Seen"
                                value={getTimeAgo(item.lastSighted)}
                                tint={isDark ? Colors.glass.text : Colors.light.icon}
                            />
                            <StatRow
                                icon={item.tnrStatus ? 'checkmark.shield.fill' : 'exclamationmark.shield.fill'}
                                label="TNR"
                                value={item.tnrStatus ? 'Sterilized' : 'Intact'}
                                tint={item.tnrStatus ? Colors.primary.green : Colors.primary.yellow}
                            />
                        </View>

                        <View style={styles.actionsRow}>
                            <MapActionButton
                                icon="fork.knife"
                                label={feedingCatId === item.id ? 'Logging…' : 'Fed'}
                                onPress={() => handleFeedCat(item)}
                                disabled={feedingCatId === item.id}
                            />
                            <MapActionButton
                                icon="cross.case.fill"
                                label={(item.status ?? '').toLowerCase() === 'needs help' ? 'Mark Stable' : 'Needs Help'}
                                onPress={() => promptNeedsHelp(item)}
                                disabled={statusUpdatingCatId === item.id}
                            />
                            <MapActionButton
                                icon="location.fill"
                                label="Navigate"
                                onPress={() => handleNavigate(item)}
                            />
                        </View>
                    </Pressable>
                </GlassView>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={INITIAL_REGION}
                userInterfaceStyle={colorScheme ?? 'light'}
                tintColor={Colors.primary.green}
            >
                {filteredCats.map((cat) => {
                    const { coordinate } = getDisplayCoordinate(cat);
                    const isSelected = selectedCatId === cat.id;
                    return (
                        <Marker
                            key={cat.id}
                            coordinate={coordinate}
                            onPress={(event) => {
                                event.stopPropagation();
                                handleMarkerPress(cat);
                            }}
                        >
                            <View
                                style={[
                                    styles.markerDot,
                                    (cat.status ?? '').toLowerCase() === 'needs help' && styles.markerNeedsHelp,
                                    isSelected && styles.markerSelected,
                                ]}
                            />
                        </Marker>
                    );
                })}
            </MapView>

            <View style={[styles.filterBarWrapper, { top: insets.top + 12 }]}>
                <GlassView style={styles.filterBar} intensity={70}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
                        {FILTERS.map((filter) => (
                            <MapFilterChip
                                key={filter.id}
                                label={filter.label}
                                active={activeFilters.has(filter.id)}
                                onPress={() => toggleFilter(filter.id)}
                            />
                        ))}
                    </ScrollView>
                </GlassView>
            </View>

            <GlassView style={styles.overlay} intensity={60}>
                <Text style={[styles.overlayText, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{catCountLabel}</Text>
            </GlassView>

            {!filteredCats.length && (
                <View style={styles.emptyState}>
                    <Text style={{ color: Colors.glass.textSecondary }}>No cats match the selected filters</Text>
                </View>
            )}

            {filteredCats.length > 0 && (
                <AnimatedFlatList
                    ref={carouselRef}
                    data={filteredCats}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderCarouselItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    decelerationRate="fast"
                    style={[
                        styles.carousel,
                        {
                            bottom: CAROUSEL_BOTTOM_OFFSET + insets.bottom * 0.5,
                            paddingBottom: insets.bottom + 36,
                        },
                    ]}
                    contentContainerStyle={styles.carouselContent}
                    onMomentumScrollEnd={onCarouselMomentumEnd}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                />
            )}
        </View>
    );
}

const MapActionButton = ({
    icon,
    label,
    onPress,
    disabled,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) => (
    <Pressable
        style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <SymbolView name={icon} size={18} tintColor={Colors.glass.text} />
        <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
);

const MapFilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={[styles.filterChip, active && styles.filterChipActive]}
    >
        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
);

const StatRow = ({
    icon,
    label,
    value,
    tint,
}: {
    icon: string;
    label: string;
    value: string;
    tint: string;
}) => (
    <View style={styles.statRow}>
        <View style={styles.statLabelRow}>
            <SymbolView name={icon} tintColor={tint} size={16} />
            <Text style={[styles.statLabel, { color: tint }]}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const getTimeAgo = (dateValue?: string | Date | null) => {
    if (!dateValue) return 'Unknown';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Unknown';
    const minutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const isRecentlySeen = (dateValue?: string | Date | null) => {
    if (!dateValue) return false;
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    const elapsedHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return elapsedHours <= 6;
};

const isCatAssignedToUser = (cat: MapCat, userId: number) => {
    const assigned = cat.assignedCaregiverId ?? cat.assigned_caregiver_id ?? cat.caregiverId;
    if (assigned === null || assigned === undefined) return false;
    return Number(assigned) === userId;
};

const catLocationCopy = (cat: MapCat, precise: boolean) => {
    if (cat.locationDescription) return cat.locationDescription;
    return precise ? 'Exact location shared' : 'Approximate location for privacy';
};

const jitterCoordinate = (latitude: number, longitude: number) => {
    const minMeters = 20;
    const maxMeters = 30;
    const meters = Math.random() * (maxMeters - minMeters) + minMeters;
    const bearing = Math.random() * Math.PI * 2;
    const deltaLat = (meters * Math.cos(bearing)) / 111_320;
    const deltaLon = (meters * Math.sin(bearing)) / (111_320 * Math.cos(latitude * Math.PI / 180));
    return {
        latitude: latitude + deltaLat,
        longitude: longitude + deltaLon,
    };
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    webFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary.dark,
    },
    markerDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: Colors.primary.green,
    },
    markerNeedsHelp: {
        backgroundColor: '#FF6B6B',
    },
    markerSelected: {
        transform: [{ scale: 1.2 }],
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    overlay: {
        position: 'absolute',
        top: 70,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    overlayText: {
        color: Colors.glass.text,
        fontWeight: 'bold',
    },
    filterBarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    filterBar: {
        borderRadius: 30,
        paddingVertical: 4,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipActive: {
        backgroundColor: Colors.primary.green,
    },
    filterChipText: {
        color: Colors.glass.text,
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0F0F0F',
    },
    emptyState: {
        position: 'absolute',
        bottom: 200,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    carousel: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    carouselContent: {
        paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    },
    cardShell: {
        borderRadius: 28,
        padding: 18,
        minHeight: 240,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#333',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    catName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    catBreed: {
        fontSize: 14,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeOk: {
        backgroundColor: 'rgba(103, 206, 103, 0.2)',
    },
    statusBadgeAlert: {
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
    },
    statusBadgeText: {
        color: Colors.glass.text,
        fontSize: 12,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    flagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    flagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    flagChipText: {
        color: Colors.glass.text,
        fontSize: 11,
        fontWeight: '700',
    },
    locationLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 4,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionLabel: {
        color: Colors.glass.text,
        fontWeight: '600',
        fontSize: 13,
    },
    statsBlock: {
        marginTop: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 6,
        paddingHorizontal: 4,
        gap: 6,
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.glass.text,
    },
});
