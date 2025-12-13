import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { getCatStatusState } from '@/lib/cat_logic';
import { addFeeding, getCats, updateCat } from '@/lib/database';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapCat = {
    id: number;
    name: string;
    image?: string;
    breed?: string;
    status?: string;
    locationDescription?: string | null;
    lastFed?: string | Date | null;
    distance?: string;
    latitude?: number;
    longitude?: number;
    timesFed?: number;
    lastSighted?: string | Date | null;
    assignedCaregiverId?: number | null;
    assigned_caregiver_id?: number | null;
    caregiverId?: number | null;
    rescueFlags?: string[];
    colorProfile?: string[];
    tnrStatus?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];
const CURRENT_USER_ID = 42;
const CARD_HORIZONTAL_MARGIN = 20;
const CARD_SPACING = 12;
const CARD_WIDTH = Dimensions.get('window').width - CARD_HORIZONTAL_MARGIN * 2;
const CAROUSEL_BOTTOM_OFFSET = 110;
const CARD_MIN_HEIGHT = 240;
const SCREEN_HEIGHT = Dimensions.get('window').height;
// When we focus the map on a marker we shift the map center slightly south so the marker
// appears above the bottom carousel card (instead of being covered by it).
const MAP_FOCUS_VERTICAL_OFFSET_FRACTION = Math.min(0.35, Math.max(0.12, (CARD_MIN_HEIGHT * 0.6) / SCREEN_HEIGHT));
const CAT_FALLBACK = require('@/assets/images/cat-placeholder.jpg');

const INITIAL_REGION: Region = {
    latitude: 25.3712,
    longitude: 51.5484,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<MapCat>);

export default function MapScreen() {
    const { isDark, colorScheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [cats, setCats] = useState<MapCat[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [feedingCatId, setFeedingCatId] = useState<number | null>(null);
    const [statusUpdatingCatId, setStatusUpdatingCatId] = useState<number | null>(null);
    const mapRef = useRef<MapView | null>(null);
    const carouselRef = useRef<FlatList<MapCat>>(null);
    const jitterCacheRef = useRef<Map<number, { latitude: number; longitude: number }>>(new Map());
    const scrollX = useRef(new Animated.Value(0)).current;
    const primaryTextColor = isDark ? Colors.glass.text : Colors.primary.dark;
    const secondaryTextColor = isDark ? Colors.glass.textSecondary : 'rgba(0,0,0,0.65)';
    const cardSurface = isDark ? Colors.glass.background : 'rgba(255,255,255,0.9)';
    const statSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const loadCats = async () => {
                try {
                    const data = await getCats();
                    if (isMounted) {
                        setCats(data as MapCat[]);
                    }
                } catch (e) {
                    console.error("Failed to load cats", e);
                }
            };

            loadCats();

            return () => {
                isMounted = false;
            };
        }, [])
    );

    // All cats are shown (no filters)
    const filteredCats = cats;



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

    const getDisplayCoordinate = useCallback(
        (cat: MapCat) => {
            const lat = cat.latitude ?? 0;
            const lon = cat.longitude ?? 0;

            if (isCatAssignedToUser(cat, CURRENT_USER_ID)) {
                jitterCacheRef.current.delete(cat.id);
                return { coordinate: { latitude: lat, longitude: lon }, precise: true };
            }
            if (!jitterCacheRef.current.has(cat.id)) {
                jitterCacheRef.current.set(cat.id, jitterCoordinate(lat, lon));
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
            // If we don't have a real coordinate, don't try to "focus" the map.
            if (!coordinate?.latitude || !coordinate?.longitude) return;
            const latitudeDelta = 0.01;
            const longitudeDelta = 0.01;
            const latitudeOffset = latitudeDelta * MAP_FOCUS_VERTICAL_OFFSET_FRACTION;
            mapRef.current.animateToRegion(
                {
                    // Center slightly south of the marker so the marker is visible above the bottom card.
                    latitude: coordinate.latitude - latitudeOffset,
                    longitude: coordinate.longitude,
                    latitudeDelta,
                    longitudeDelta,
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

    const catCountLabel = `${cats.length} cats nearby`;

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
        const statusState = getCatStatusState(item as any); // Calculate status

        return (
            <Animated.View
                style={{
                    width: CARD_WIDTH,
                    transform: [{ scale }],
                    marginRight: isLast ? 0 : CARD_SPACING,
                }}
            >
                <GlassView intensity={80} style={[styles.cardShell, { backgroundColor: cardSurface }]}>
                    <Pressable onPress={() => router.push(`/cat/${item.id}`)} style={{ flex: 1 }}>
                        <View style={styles.cardHeader}>
                            <Image
                                source={item.image ? { uri: item.image } : CAT_FALLBACK}
                                style={styles.avatar}
                            />
                            <View style={{ flex: 1 }}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={[styles.catName, { color: primaryTextColor }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: statusState.statusColor }
                                    ]}>
                                        <Text style={[
                                            styles.statusBadgeText,
                                            { color: statusState.labelColor }
                                        ]}>{statusState.statusText}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.catBreed, { color: secondaryTextColor }]} numberOfLines={1}>
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
                            <Text style={[styles.locationLabel, { color: secondaryTextColor }]}>
                                {catLocationCopy(item, precise)}
                            </Text>
                        </View>

                        {item.rescueFlags?.length ? (
                            <Text style={[styles.tagline, { color: secondaryTextColor }]}>
                                {item.rescueFlags[0]
                                    ? item.rescueFlags[0].charAt(0).toUpperCase() + item.rescueFlags[0].slice(1)
                                    : ''}
                            </Text>
                        ) : null}

                        <View style={[styles.statsBlock, { backgroundColor: statSurface }]}>
                            <StatRow
                                icon="fork.knife"
                                label="Last Fed"
                                value={getTimeAgo(item.lastFed)}
                                tint={statusState.markerColor === 'green' ? '#34C759' : statusState.markerColor === 'orange' ? '#F4B63E' : '#FF6B6B'}
                                valueColor={primaryTextColor}
                                dynamicLabelColor={primaryTextColor}
                            />
                            <StatRow
                                icon="eye.fill"
                                label="Seen"
                                value={getTimeAgo(item.lastSighted)}
                                tint="#34C759"
                                valueColor={primaryTextColor}
                                dynamicLabelColor={primaryTextColor}
                            />
                            <StatRow
                                icon={item.tnrStatus ? 'checkmark.shield.fill' : 'exclamationmark.shield.fill'}
                                label="TNR"
                                value={item.tnrStatus ? 'Sterilized' : 'Intact'}
                                tint={Colors.primary.blue}
                                valueColor={primaryTextColor}
                                dynamicLabelColor={primaryTextColor}
                            />
                        </View>

                        <View style={styles.actionsRow}>
                            <MapActionButton
                                icon="fork.knife"
                                label={feedingCatId === item.id ? 'Logging…' : 'Fed'}
                                onPress={() => handleFeedCat(item)}
                                disabled={feedingCatId === item.id}
                                textColor={primaryTextColor}
                                iconColor={primaryTextColor}
                                backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                            />
                            <MapActionButton
                                icon="cross.case.fill"
                                label={(item.status ?? '').toLowerCase() === 'needs help' ? 'Mark OK' : 'Help'}
                                onPress={() => promptNeedsHelp(item)}
                                disabled={statusUpdatingCatId === item.id}
                                textColor={primaryTextColor}
                                iconColor={primaryTextColor}
                                backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                            />
                            <MapActionButton
                                icon="location.fill"
                                label="Go"
                                onPress={() => handleNavigate(item)}
                                textColor={primaryTextColor}
                                iconColor={primaryTextColor}
                                backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
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
                showsPointsOfInterest={false}
                userInterfaceStyle={colorScheme ?? 'light'}
                tintColor={Colors.primary.green}
            >
                {filteredCats.map((cat) => {
                    const { coordinate } = getDisplayCoordinate(cat);
                    const isSelected = selectedCatId === cat.id;
                    // Cast to any to satisfy type overlap if needed, though StatusCat is compatible.
                    const statusState = getCatStatusState(cat as any);

                    return (
                        <Marker
                            key={String(cat.id)}
                            coordinate={coordinate}
                            onPress={(event) => {
                                event.stopPropagation();
                                handleMarkerPress(cat);
                            }}
                            testID={`marker-${cat.id}`}
                        >
                            {/* Simplified Marker View for performance, prioritizing the Ring color */}
                            <View style={[
                                styles.markerRing,
                                isSelected && styles.markerRingActive,
                                { borderColor: statusState.markerColor }
                            ]}>
                                <Image
                                    source={cat.image ? { uri: cat.image } : CAT_FALLBACK}
                                    style={styles.markerImage}
                                />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            <GlassView style={[styles.catCountPill, { top: insets.top + 12 }]} intensity={70}>
                <Text style={[styles.catCountText, { color: primaryTextColor }]}>{catCountLabel}</Text>
            </GlassView>

            <View style={[styles.topRightButtons, { top: insets.top + 12 }]}>
                <GlassView style={styles.topRightButton} intensity={70}>
                    <Pressable
                        onPress={() => router.push('/discover')}
                        accessibilityLabel="Browse cats"
                        style={styles.topRightButtonInner}
                    >
                        <SymbolView name="line.3.horizontal" size={22} tintColor={primaryTextColor} />
                    </Pressable>
                </GlassView>
                <GlassView style={styles.topRightButton} intensity={70}>
                    <Pressable
                        onPress={() => router.push('/report')}
                        accessibilityLabel="Add cat"
                        style={styles.topRightButtonInner}
                    >
                        <SymbolView name="plus" size={24} tintColor={primaryTextColor} />
                    </Pressable>
                </GlassView>
            </View>

            {!filteredCats.length && (
                <View style={styles.emptyState}>
                    <Text style={{ color: secondaryTextColor }}>No cats match the selected filters</Text>
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
                            bottom: CAROUSEL_BOTTOM_OFFSET + insets.bottom - 70,
                            paddingBottom: insets.bottom,
                        },
                    ]}
                    contentContainerStyle={styles.carouselContent}
                    onMomentumScrollEnd={onCarouselMomentumEnd}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                    getItemLayout={(data, index) => ({
                        length: CARD_WIDTH + CARD_SPACING,
                        offset: (CARD_WIDTH + CARD_SPACING) * index,
                        index,
                    })}
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
    textColor,
    iconColor,
    backgroundColor,
}: {
    icon: SymbolName;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    textColor: string;
    iconColor: string;
    backgroundColor: string;
}) => (
    <Pressable
        style={[styles.actionButton, { backgroundColor }, disabled && styles.actionButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <SymbolView name={icon} size={18} tintColor={iconColor} />
        <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
);

const StatRow = ({
    icon,
    label,
    value,
    tint,
    valueColor,
    dynamicLabelColor,
}: {
    icon: SymbolName;
    label: string;
    value: string;
    tint: string;
    valueColor: string;
    dynamicLabelColor?: string;
}) => (
    <View style={styles.statRow}>
        <View style={styles.statLabelRow}>
            <SymbolView name={icon} tintColor={tint} size={16} />
            <Text style={[styles.statLabel, { color: dynamicLabelColor ?? tint }]}>{label}</Text>
        </View>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
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
    catCountPill: {
        position: 'absolute',
        left: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    catCountText: {
        fontWeight: '700',
        fontSize: 15,
    },
    addCatButton: {
        position: 'absolute',
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    addCatButtonInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topRightButtons: {
        position: 'absolute',
        right: 20,
        flexDirection: 'row',
        gap: 10,
    },
    topRightButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    topRightButtonInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#333333',
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
        backgroundColor: 'rgba(93, 194, 62, 1)',
    },
    statusBadgeAlert: {
        backgroundColor: 'rgba(255, 48, 48, 0.8)',
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
    tagline: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
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
        fontWeight: '600',
        fontSize: 13,
    },
    statsBlock: {
        marginTop: 10,
        borderRadius: 16,
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
    },
    markerRing: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'white',
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    markerRingActive: {
        transform: [{ scale: 1.25 }],
        zIndex: 999,
    },
    markerImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
});
