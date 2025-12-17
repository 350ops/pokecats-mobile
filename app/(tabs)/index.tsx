import { MapCatCard } from '@/components/MapCatCard';
import { MarkerView } from '@/components/MarkerView';
import { GlassView } from '@/components/ui/GlassView';
import { NativeGlassIconButton } from '@/components/ui/NativeGlassIconButton';
import { getColorLabel, getPatternLabel } from '@/constants/CatAppearance';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { getCatStatusState } from '@/lib/cat_logic';
import { addFeeding, addSighting, getCats, updateCat } from '@/lib/database';
import { updateWidgetData } from '@/lib/widget';
import * as ExpoLocation from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapCat = {
    id: number;
    name: string;
    image?: string;
    appearance?: string;
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
    primaryColor?: string | null;
    pattern?: string | null;
    sex?: string;
    approximateAge?: string | null;
    needsAttention?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];
const CURRENT_USER_ID = 42;
const CARD_HORIZONTAL_MARGIN = 20;
const CARD_SPACING = 12;
const CARD_WIDTH = Dimensions.get('window').width - CARD_HORIZONTAL_MARGIN * 2;
const CAROUSEL_BOTTOM_OFFSET = 95;
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
    const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('satellite');
    const [mapModesModalVisible, setMapModesModalVisible] = useState(false);
    const [initialRegion, setInitialRegion] = useState<Region>(INITIAL_REGION);
    const mapRef = useRef<MapView | null>(null);
    const carouselRef = useRef<FlatList<MapCat>>(null);
    const jitterCacheRef = useRef<Map<number, { latitude: number; longitude: number }>>(new Map());
    const scrollX = useRef(new Animated.Value(0)).current;
    const primaryTextColor = isDark ? Colors.glass.text : Colors.primary.dark;
    const secondaryTextColor = isDark ? Colors.glass.textSecondary : 'rgba(0,0,0,0.65)';
    const cardSurface = isDark ? 'rgba(32, 32, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    const statSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    // Center map on user's location when app opens
    useEffect(() => {
        const centerOnUserLocation = async () => {
            try {
                const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                const location = await ExpoLocation.getCurrentPositionAsync({});
                const userRegion: Region = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                };
                setInitialRegion(userRegion);

                // Also animate to user location with 3D tilt
                mapRef.current?.animateCamera({
                    center: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    pitch: 55,
                    heading: 0,
                    altitude: 800,
                    zoom: 17,
                }, { duration: 1000 });
            } catch (error) {
                console.log('Could not get user location, using default region');
            }
        };

        centerOnUserLocation();
    }, []);


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
            updateWidgetData([]); // Clear widget if no cats
            return;
        }

        updateWidgetData(filteredCats); // Update widget with new cat list

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
            const latitudeOffset = latitudeDelta * MAP_FOCUS_VERTICAL_OFFSET_FRACTION;

            // Use animateCamera to maintain 3D pitch
            mapRef.current.animateCamera(
                {
                    center: {
                        latitude: coordinate.latitude - latitudeOffset,
                        longitude: coordinate.longitude,
                    },
                    pitch: 45,
                    heading: 0,
                    altitude: 1000, // Approximate zoom for delta 0.01
                    zoom: 15,
                },
                { duration: 1000 }
            );
        },
        [getDisplayCoordinate]
    );

    useEffect(() => {
        if (selectedCat) {
            focusMapOnCat(selectedCat);
        }
    }, [selectedCat, focusMapOnCat]);

    useEffect(() => {
        // Initial 3D tilt
        mapRef.current?.animateCamera({ pitch: 45, heading: 0 }, { duration: 1000 });
    }, []);

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
                addSighting(cat.id), // Also mark as seen
                updateCat(cat.id, { lastFed: timestamp, lastSighted: timestamp }),
            ]);
            setCats((prev) =>
                prev.map((item) =>
                    item.id === cat.id
                        ? {
                            ...item,
                            lastFed: new Date(timestamp),
                            lastSighted: new Date(timestamp), // Update local state for "Seen"
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

    const centerOnUserLocation = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to center on your location.');
                return;
            }
            const location = await ExpoLocation.getCurrentPositionAsync({});
            mapRef.current?.animateCamera({
                center: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                pitch: 45,
                heading: 0,
                altitude: 1000,
                zoom: 15,
            }, { duration: 1000 });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to get your location.');
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
        const statusState = getCatStatusState(item as any);

        // Local state for carousel and uploading - separated component to avoid hooks in renderItem?
        // Inline renderItem with hooks causes issues. 
        // We must extract this to a component to use hooks like useState/useEffect for the carousel.
        return (
            <Animated.View
                style={{
                    width: CARD_WIDTH,
                    transform: [{ scale }],
                    marginRight: isLast ? 0 : CARD_SPACING,
                }}
            >
                <MapCatCard
                    item={item}
                    statusState={statusState}
                    onNavigate={() => handleNavigate(item)}
                    onFeed={() => handleFeedCat(item)}
                    onNeedsHelp={() => promptNeedsHelp(item)}
                    isFeeding={feedingCatId === item.id}
                    isUpdatingStatus={statusUpdatingCatId === item.id}
                    cardSurface={cardSurface}
                    primaryTextColor={primaryTextColor}
                    secondaryTextColor={secondaryTextColor}
                    statSurface={statSurface}
                />
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={initialRegion}
                showsPointsOfInterest={false}
                userInterfaceStyle={colorScheme ?? 'light'}
                tintColor={Colors.primary.green}
                mapType={mapType === 'satellite' ? (Platform.OS === 'android' ? 'satellite' : 'satelliteFlyover') : mapType}
                pitchEnabled={true}
                showsBuildings={true}
                showsUserLocation={true}
            >
                {filteredCats.map((cat) => {
                    const { coordinate } = getDisplayCoordinate(cat);
                    const isSelected = selectedCatId === cat.id;
                    // Cast to any to satisfy type overlap if needed, though StatusCat is compatible.
                    const statusState = getCatStatusState(cat as any);

                    return (
                        <React.Fragment key={String(cat.id)}>
                            {/* 75m radius circle around selected marker only */}
                            {isSelected && (
                                <Circle
                                    center={coordinate}
                                    radius={75}
                                    fillColor="rgba(128, 128, 128, 0.2)"
                                    strokeColor="rgba(255, 255, 255, 0.8)"
                                    strokeWidth={2}
                                />
                            )}
                            <Marker
                                coordinate={coordinate}
                                onPress={(event) => {
                                    event.stopPropagation();
                                    handleMarkerPress(cat);
                                }}
                                testID={`marker-${cat.id}`}
                                style={{ zIndex: isSelected ? 999 : 1 }}
                            // Anchor at bottom center (where the pin tip is)
                            // Default is (0.5, 0.5). For a pin, we want (0.5, 1.0) usually?
                            // My MarkerView has `marginBottom: SIZE/2` to shift it up visually.
                            // So (0.5, 0.5) might work if the visual center is the middle of the bounding box?
                            // Let's rely on standard centering and the generic styling first.
                            // Actually, standard pins need `anchor={{ x: 0.5, y: 1 }}` but I'll check my styling.
                            >
                                <MarkerView
                                    color={statusState.markerColor}
                                    selected={isSelected}
                                    glyph={cat.tnrStatus ? 'checkmark.shield.fill' : 'pawprint.fill'}
                                />
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapView>

            <Pressable
                style={[styles.catCountPill, { top: insets.top + 12 }]}
                onPress={() => router.push({ pathname: '/discover', params: { sort: 'distance' } })}
            >
                <GlassView
                    style={{
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 24,
                        backgroundColor: 'transparent',
                        borderWidth: 0
                    }}
                    intensity={70}
                    tintColor="rgba(0,0,0,0)" // Transparent tint to match NativeGlassIconButton
                >
                    <Text style={[styles.catCountText, { color: primaryTextColor }]}>{catCountLabel}</Text>
                </GlassView>
            </Pressable>

            <View style={[styles.topRightButtons, { top: insets.top + 12 }]}>
                <NativeGlassIconButton
                    icon="line.3.horizontal"
                    size={44}
                    iconSize={22}
                    onPress={() => router.push('/discover')}
                    accessibilityLabel="Browse cats"
                />
                <NativeGlassIconButton
                    icon="plus"
                    size={44}
                    iconSize={24}
                    onPress={() => router.push('/report')}
                    accessibilityLabel="Add cat"
                />
            </View>

            {/* Map Controls Pill - Right Side */}
            <View style={[styles.mapControlsPill, { top: insets.top + 72 }]}>
                <GlassView
                    style={styles.mapControlsPillInner}
                    intensity={70}
                    tintColor="rgba(0,0,0,0)"
                >
                    <Pressable
                        style={styles.mapControlButton}
                        onPress={() => setMapModesModalVisible(true)}
                        accessibilityLabel="Map modes"
                    >
                        <SymbolView name="map.fill" size={20} tintColor={primaryTextColor} />
                    </Pressable>
                    <View style={styles.mapControlDivider} />
                    <Pressable
                        style={styles.mapControlButton}
                        onPress={centerOnUserLocation}
                        accessibilityLabel="Center on my location"
                    >
                        <SymbolView name="location.fill" size={20} tintColor={Colors.primary.blue} />
                    </Pressable>
                </GlassView>
            </View>

            {/* Map Modes Modal */}
            <Modal
                visible={mapModesModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMapModesModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMapModesModalVisible(false)}
                >
                    <View style={styles.mapModesModal}>
                        <View style={styles.mapModesHeader}>
                            <Text style={styles.mapModesTitle}>Map Modes</Text>
                            <Pressable onPress={() => setMapModesModalVisible(false)}>
                                <SymbolView name="xmark" size={20} tintColor="#666" />
                            </Pressable>
                        </View>
                        <View style={styles.mapModesGrid}>
                            <Pressable
                                style={[
                                    styles.mapModeOption,
                                    mapType === 'standard' && styles.mapModeOptionSelected
                                ]}
                                onPress={() => {
                                    setMapType('standard');
                                    setMapModesModalVisible(false);
                                }}
                            >
                                <View style={styles.mapModePreview}>
                                    <SymbolView name="map" size={32} tintColor="#666" />
                                </View>
                                <Text style={styles.mapModeLabel}>Explore</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.mapModeOption,
                                    mapType === 'hybrid' && styles.mapModeOptionSelected
                                ]}
                                onPress={() => {
                                    setMapType('hybrid');
                                    setMapModesModalVisible(false);
                                }}
                            >
                                <View style={styles.mapModePreview}>
                                    <SymbolView name="car.fill" size={32} tintColor="#666" />
                                </View>
                                <Text style={styles.mapModeLabel}>Hybrid</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.mapModeOption,
                                    mapType === 'satellite' && styles.mapModeOptionSelected
                                ]}
                                onPress={() => {
                                    setMapType('satellite');
                                    setMapModesModalVisible(false);
                                }}
                            >
                                <View style={styles.mapModePreview}>
                                    <SymbolView name="globe.americas.fill" size={32} tintColor="#666" />
                                </View>
                                <Text style={styles.mapModeLabel}>Satellite</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.mapModesAttribution}>© OpenStreetMap and other data providers</Text>
                    </View>
                </Pressable>
            </Modal>

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

const formatCatAppearance = (cat: MapCat): string => {
    const parts: string[] = [];

    if (cat.primaryColor) {
        parts.push(getColorLabel(cat.primaryColor));
    }
    if (cat.pattern && cat.pattern !== 'unknown') {
        parts.push(getPatternLabel(cat.pattern));
    }

    if (parts.length === 0) {
        // Fallback to sex if no appearance info
        if (cat.sex && cat.sex !== 'unknown') {
            return cat.sex.charAt(0).toUpperCase() + cat.sex.slice(1);
        }
        return 'Unknown';
    }

    return parts.join(' • ');
};

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
        borderRadius: 24,
        overflow: 'hidden',
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
    catAppearance: {
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
    markerImage: {
        width: '100%',
        height: '100%',
    },
    // Map Controls Pill styles
    mapControlsPill: {
        position: 'absolute',
        right: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    mapControlsPillInner: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 24,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    mapControlButton: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapControlDivider: {
        width: 24,
        height: 1,
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    mapModesModal: {
        backgroundColor: '#F2F2F7',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    mapModesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    mapModesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        textAlign: 'center',
    },
    mapModesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    mapModeOption: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    mapModeOptionSelected: {
        borderColor: Colors.primary.blue,
    },
    mapModePreview: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    mapModeLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
    },
    mapModesAttribution: {
        fontSize: 11,
        color: '#8E8E93',
        textAlign: 'center',
    },
});
