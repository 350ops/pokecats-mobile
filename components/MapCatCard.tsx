import { GlassView } from '@/components/ui/GlassView';
import { formatCatAppearance } from '@/constants/CatAppearance';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { addCatPhoto, addSighting, getCatPhotos, uploadCatImage } from '@/lib/database';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const CAT_FALLBACK = require('@/assets/images/cat-placeholder.jpg');

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

type SymbolName = React.ComponentProps<typeof SymbolView>['name'];

interface MapCatCardProps {
    item: MapCat;
    statusState: {
        statusColor: string;
        labelColor: string;
        statusText: string;
        markerColor: string;
    };
    onNavigate: () => void;
    onFeed: () => void;
    onNeedsHelp: () => void;
    isFeeding: boolean;
    isUpdatingStatus: boolean;
    cardSurface: string;
    primaryTextColor: string;
    secondaryTextColor: string;
    statSurface: string;
}

export function MapCatCard({
    item,
    statusState,
    onNavigate,
    onFeed,
    onNeedsHelp,
    isFeeding,
    isUpdatingStatus,
    cardSurface,
    primaryTextColor,
    secondaryTextColor,
    statSurface
}: MapCatCardProps) {
    const { isDark } = useTheme();
    const [photos, setPhotos] = useState<string[]>(item.image ? [item.image] : []);
    const [uploading, setUploading] = useState(false);
    const [lastSighted, setLastSighted] = useState(item.lastSighted);

    useEffect(() => {
        setLastSighted(item.lastSighted);
    }, [item.lastSighted]);

    useEffect(() => {
        const loadPhotos = async () => {
            const dbPhotos = await getCatPhotos(item.id);
            if (dbPhotos && dbPhotos.length > 0) {
                setPhotos(dbPhotos.map(p => p.url));
            } else if (item.image) {
                setPhotos([item.image]);
            }
        };
        loadPhotos();
    }, [item.id, item.image]);

    const handleSeen = async () => {
        try {
            setLastSighted(new Date().toISOString());
            await addSighting(item.id);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to record sighting.');
        }
    };

    const handlePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission needed', 'Camera access is required to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setUploading(true);
                const publicUrl = await uploadCatImage(result.assets[0].uri);
                if (publicUrl) {
                    await addCatPhoto(item.id, publicUrl);
                    setPhotos(prev => [publicUrl, ...prev]);
                } else {
                    Alert.alert('Upload Failed', 'Could not upload photo.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong taking the photo.');
        } finally {
            setUploading(false);
        }
    };

    const renderPhoto = ({ item: photoUrl }: { item: string }) => (
        <Image
            source={{ uri: photoUrl }}
            style={styles.avatar}
            resizeMode="cover"
        />
    );

    return (
        <GlassView intensity={80} style={[styles.cardShell, { backgroundColor: cardSurface }]}>
            <Pressable onPress={() => router.push(`/cat/${item.id}`)} style={{ flex: 1 }}>

                {/* Header with Carousel */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        {photos.length > 0 ? (
                            <FlatList
                                data={photos}
                                renderItem={renderPhoto}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.carousel}
                            />
                        ) : (
                            <Image source={CAT_FALLBACK} style={styles.avatar} />
                        )}
                        {uploading && (
                            <View style={[styles.avatar, styles.loaderOverlay]}>
                                <ActivityIndicator color="#fff" size="small" />
                            </View>
                        )}
                        {photos.length > 1 && (
                            <View style={styles.pageIndicator}>
                                <Text style={styles.pageIndicatorText}>{photos.length}</Text>
                            </View>
                        )}
                    </View>

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
                        <Text style={[styles.catAppearance, { color: secondaryTextColor }]} numberOfLines={1}>
                            {formatCatAppearance(item)}
                        </Text>
                    </View>
                </View>

                {/* Location - Only if description exists, remove lock/privacy text */}
                {item.locationDescription ? (
                    <View style={styles.locationRow}>
                        <SymbolView
                            name="mappin.and.ellipse"
                            tintColor={secondaryTextColor}
                            size={16}
                        />
                        <Text style={[styles.locationLabel, { color: secondaryTextColor }]}>
                            {item.locationDescription}
                        </Text>
                    </View>
                ) : null}

                {/* Stats */}
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
                        value={getTimeAgo(lastSighted)}
                        tint="#32D74B"
                        valueColor={primaryTextColor}
                        dynamicLabelColor={primaryTextColor}
                    />
                    <StatRow
                        icon={item.tnrStatus ? 'checkmark.shield.fill' : 'exclamationmark.shield.fill'}
                        label="TNR"
                        value={item.tnrStatus ? 'Neutered' : 'Not Neutered'}
                        tint={Colors.primary.blue}
                        valueColor={primaryTextColor}
                        dynamicLabelColor={primaryTextColor}
                    />
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <MapActionButton
                        icon="eye.fill"
                        label="Seen"
                        onPress={handleSeen}
                        textColor={primaryTextColor}
                        iconColor="#32D74B"
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                    <MapActionButton
                        icon="pencil"
                        label="Edit"
                        onPress={() => router.push(`/cat/${item.id}/edit`)}
                        textColor={primaryTextColor}
                        iconColor={secondaryTextColor}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                    <MapActionButton
                        icon="camera.fill"
                        label="Photo"
                        onPress={handlePhoto}
                        textColor={primaryTextColor}
                        iconColor={secondaryTextColor}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                </View>

                {/* Secondary Actions (Fed/Go/Help) - maybe make these smaller or secondary? 
                    The user requested Seen/Edit/Photo specifically. 
                    I'll keep specific ones that are critical.
                    Navigation (Go) is critical for map.
                    Feeding is critical.
                    Let's combine them intelligently.
                */}
                <View style={[styles.actionsRow, { marginTop: 8 }]}>
                    <AnimatedFeedButton
                        item={item}
                        isFeeding={isFeeding}
                        onPress={onFeed}
                        textColor={primaryTextColor}
                        iconColor={primaryTextColor}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                    <MapActionButton
                        icon="location.fill"
                        label="Go"
                        onPress={onNavigate}
                        textColor={primaryTextColor}
                        iconColor={primaryTextColor}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                </View>

            </Pressable>
        </GlassView>
    );
}

// Helpers
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

const styles = StyleSheet.create({
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
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 16, // Squircleish
        overflow: 'hidden',
        backgroundColor: '#333',
    },
    avatar: {
        width: 80,
        height: 80,
    },
    carousel: {
        flex: 1,
    },
    loaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    pageIndicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
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
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    locationLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    statsBlock: {
        marginTop: 10,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        fontSize: 12,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 14,
        marginHorizontal: 4,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionLabel: {
        fontWeight: '600',
        fontSize: 13,
    },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedFeedButton({
    item,
    isFeeding,
    onPress,
    textColor,
    iconColor,
    backgroundColor,
}: {
    item: MapCat;
    isFeeding: boolean;
    onPress: () => void;
    textColor: string;
    iconColor: string;
    backgroundColor: string;
}) {
    const scale = useSharedValue(1);
    const heartScale = useSharedValue(0);
    const heartOpacity = useSharedValue(0);
    const heartTransY = useSharedValue(0);

    // Track lastFed to detect success
    const [prevLastFed, setPrevLastFed] = useState(item.lastFed);

    useEffect(() => {
        // Did lastFed change significantly? (Success case)
        const hasChanged = item.lastFed !== prevLastFed;
        const isNow = item.lastFed && new Date(item.lastFed).getTime() > Date.now() - 10000; // Updated "just now"

        if (hasChanged && !isFeeding) {
            // SUCCESS ANIMATION
            playSuccessAnimation();
        } else if (!isFeeding && scale.value !== 1) {
            // FAILURE / RESET
            scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.ease) });
        }
        setPrevLastFed(item.lastFed);
    }, [item.lastFed, isFeeding]);

    const playSuccessAnimation = () => {
        // Reset heart position
        heartTransY.value = 0;
        heartOpacity.value = 1;

        // Heart Pulse
        heartScale.value = withSequence(
            withTiming(1.15, { duration: 180, easing: Easing.out(Easing.ease) }), // 0 -> 1.15 is harsh? User said Scale: 0.6 -> 1.15
            withTiming(1.0, { duration: 80, easing: Easing.out(Easing.ease) })
        );

        // Wait, start scale should be 0.6?
        // User said: Scale: 0.6 -> 1.15 -> 1.0.
        // Assuming heartScale was 0 hidden.
        // I need to set it to 0.6 first immediately?
        // withSequence starts from current.
        // I should set initial to 0.6 if opacity is 1?
        // I'll set it in the sequence.

        // Correct Sequence for Heart Scale from 0.0 (hidden)
        // Jump to 0.6, then animate
        heartScale.value = 0.6;
        heartScale.value = withSequence(
            withTiming(1.15, { duration: 200, easing: Easing.out(Easing.ease) }),
            withTiming(1.0, { duration: 100, easing: Easing.out(Easing.ease) })
        );

        // Float Up (Subtle)
        heartTransY.value = withTiming(-8, {
            duration: 400, // Combined with opacity fade (user said 200ms duration for fade?? No "Duration 180-220ms")
            easing: Easing.out(Easing.ease),
        });

        // Fade Out
        // User said Opacity: 0 -> 1 -> 0
        // I set Opacity 1 immediately at start.
        // Then at end fade out?
        // "Combined with opacity fade".
        // Let's hold opacity 1 for a bit then fade?
        // Or fade in then out?
        // "Opacity: 0 -> 1 -> 0"

        heartOpacity.value = 0;
        heartOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(1, { duration: 150 }), // Hold?
            withTiming(0, { duration: 220 })
        );

        // Button Return
        scale.value = withTiming(1.0, {
            duration: 120,
            easing: Easing.out(Easing.ease),
        });
    };

    const handlePress = () => {
        if (isFeeding) return;
        // Press feedback
        scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.ease) });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const rButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const rHeartStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: heartScale.value },
            { translateY: heartTransY.value }
        ],
        opacity: heartOpacity.value,
    }));

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <AnimatedPressable
                style={[styles.actionButton, { backgroundColor }, rButtonStyle]}
                onPress={handlePress}
                disabled={isFeeding}
            >
                <SymbolView name="fork.knife" size={18} tintColor={iconColor} />
                <Text style={[styles.actionLabel, { color: textColor }]}>
                    {isFeeding ? 'Logging...' : 'Feed'}
                </Text>
            </AnimatedPressable>

            {/* Heart Icon (Absolute) */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 },
                rHeartStyle
            ]}>
                <SymbolView
                    name="heart.fill"
                    size={24}
                    tintColor="#FF6B6B" // Brand accent soft red/pink
                />
            </Animated.View>
        </View>
    );
}
