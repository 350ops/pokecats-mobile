import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { addCatPhoto, addFeeding, addSighting, getCatPhotos, updateCat, uploadCatImage } from '@/lib/database';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { GlassView } from './ui/GlassView';

// Compatible definition with DB and Map
interface Cat {
    id: number | string;
    name: string;
    image?: string;
    appearance?: string;
    status?: string;
    distance?: string;
    lastSighted?: string | Date | null;
    timesFed?: number;
    rescueFlags?: string[];
    colorProfile?: string[];
    isColonyCat?: boolean;
    adoptionStatus?: string;
    tnrStatus?: boolean;
    lastFed?: string | Date | null;
}

interface CatCardProps {
    cat: Cat & {
        distanceMeters?: number;
    };
}

type DistanceMeta = {
    label: string;
    value: string;
    background: string;
    text: string;
};

const CheckmarkIcon = require('@/assets/images/Checkmark.png');
const ExclamationIcon = require('@/assets/images/Exclamation.png');
const ShieldIcon = require('@/assets/images/Shield.png');
const CatPlaceholder = require('@/assets/images/cat-placeholder.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CatCard({ cat }: CatCardProps) {
    const { isDark } = useTheme();
    const distanceMeta = getDistanceMeta(cat);
    const needsHelp = (cat.status ?? '').toLowerCase() === 'needs help';
    const isTnrd = cat.tnrStatus === true;

    // Local state for "Seen" update (optimistic)
    const [lastSighted, setLastSighted] = useState(cat.lastSighted);
    const [photos, setPhotos] = useState<string[]>(cat.image ? [cat.image] : []);
    const [uploading, setUploading] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);
    const [isMarkingSeen, setIsMarkingSeen] = useState(false);

    useEffect(() => {
        setLastSighted(cat.lastSighted);
    }, [cat.lastSighted]);

    useEffect(() => {
        // Fetch photos on mount
        const loadPhotos = async () => {
            const dbPhotos = await getCatPhotos(Number(cat.id));
            if (dbPhotos && dbPhotos.length > 0) {
                setPhotos(dbPhotos.map(p => p.url));
            } else if (cat.image) {
                setPhotos([cat.image]);
            }
        };
        loadPhotos();
    }, [cat.id, cat.image]);

    const handleSeen = async () => {
        if (isMarkingSeen) return;
        try {
            setIsMarkingSeen(true);
            setLastSighted(new Date().toISOString()); // Optimistic
            await addSighting(cat.id);
            // Wait for animation
            setTimeout(() => setIsMarkingSeen(false), 1500);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to record sighting.');
            setIsMarkingSeen(false);
        }
    };

    const handleFeed = async () => {
        if (isFeeding) return;
        try {
            setIsFeeding(true);
            await addFeeding(Number(cat.id), 'Quick Feed', 'Snack', false);
            await updateCat(Number(cat.id), { lastFed: new Date().toISOString() });
            setTimeout(() => setIsFeeding(false), 1500);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to log feeding.');
            setIsFeeding(false);
        }
    };

    const handleEdit = () => {
        router.push(`/cat/${cat.id}/edit`);
    };

    const handlePhoto = async () => {
        try {
            // Check permissions first? expo-image-picker handles it usually
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setUploading(true);
                const publicUrl = await uploadCatImage(result.assets[0].uri);
                if (publicUrl) {
                    await addCatPhoto(Number(cat.id), publicUrl);
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

    const renderPhoto = ({ item }: { item: string }) => (
        <Image
            source={{ uri: item }}
            style={[styles.image, { width: SCREEN_WIDTH - 80 }]}
            resizeMode="cover"
        />
    );

    return (
        <GlassView
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? Colors.glass.background : '#FFFFFF',
                    borderColor: isDark ? Colors.glass.border : 'rgba(0,0,0,0.08)',
                }
            ]}
            intensity={isDark ? 50 : 0}
        >
            <View style={styles.imageWrapper}>
                {photos.length > 0 ? (
                    <FlatList
                        data={photos}
                        renderItem={renderPhoto}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.carousel}
                        contentContainerStyle={styles.carouselContent}
                    />
                ) : (
                    <Image source={CatPlaceholder} style={styles.image} />
                )}

                {uploading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator color="#fff" size="large" />
                    </View>
                )}

                <View style={styles.statusIcons}>
                    <Image source={needsHelp ? ExclamationIcon : CheckmarkIcon} style={styles.statusIcon} />
                    {isTnrd && <Image source={ShieldIcon} style={styles.statusIcon} />}
                </View>

                {photos.length > 1 && (
                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>{photos.length} photos</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.distanceRow}>
                    <View style={[styles.distancePill, { backgroundColor: distanceMeta.background }]}>
                        <Text style={[styles.distanceLabel, { color: distanceMeta.text }]} numberOfLines={1}>{distanceMeta.label}</Text>
                        <Text style={[styles.distanceValue, { color: distanceMeta.text }]} numberOfLines={1}>{distanceMeta.value}</Text>
                    </View>
                </View>

                <Text style={[styles.name, { color: isDark ? Colors.glass.text : Colors.light.text }]} numberOfLines={1}>
                    {cat.name}
                </Text>
                <Text style={[styles.appearance, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]} numberOfLines={1}>
                    {cat.appearance}
                </Text>

                {/* New Action Buttons */}
                {/* New Action Buttons */}
                <View style={styles.actionRow}>
                    <AnimatedActionButton
                        style={styles.actionButton}
                        icon="eye.fill"
                        popupIcon="checkmark.circle.fill"
                        popupColor={Colors.primary.blue}
                        onPress={handleSeen}
                        isActive={isMarkingSeen}
                        iconColor={Colors.primary.blue}
                        backgroundColor={isDark ? 'rgba(63, 143, 247, 0.15)' : 'rgba(63, 143, 247, 0.1)'}
                    />
                    <AnimatedActionButton
                        style={styles.actionButton}
                        icon="pencil"
                        onPress={handleEdit}
                        iconColor={isDark ? Colors.glass.textSecondary : Colors.light.icon}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                    <AnimatedActionButton
                        style={styles.actionButton}
                        icon="fork.knife"
                        popupIcon="heart.fill"
                        popupColor="#FF6B6B"
                        onPress={handleFeed}
                        isActive={isFeeding}
                        iconColor={isDark ? '#E058AE' : '#E058AE'}
                        backgroundColor={isDark ? 'rgba(163, 13, 133, 0.89)' : 'rgba(203, 23, 173, 0.79)'}
                    />
                    <AnimatedActionButton
                        style={styles.actionButton}
                        icon="camera.fill"
                        onPress={handlePhoto}
                        iconColor={isDark ? Colors.glass.textSecondary : Colors.light.icon}
                        backgroundColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    />
                </View>

                <View style={styles.footerRow}>
                    <Text style={[styles.meta, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                        Seen {formatTimeAgo(lastSighted)}
                    </Text>
                </View>
            </View>
        </GlassView>
    );
}


const getDistanceMeta = (cat: Cat & { distanceMeters?: number }): DistanceMeta => {
    const meters = cat.distanceMeters ?? parseDistanceFromString(cat.distance);
    if (!meters || meters <= 0) {
        return { label: 'Unknown', value: cat.distance ?? '—', background: 'rgba(255,255,255,0.08)', text: Colors.glass.text };
    }

    if (meters < 500) {
        return {
            label: 'Nearby',
            value: formatMeters(meters),
            background: 'rgba(103, 206, 103, 0.18)',
            text: Colors.primary.green,
        };
    }

    if (meters < 2000) {
        return {
            label: 'Walk',
            value: formatMeters(meters),
            background: 'rgba(0, 143, 33, 0.66)',
            text: Colors.glass.text,
        };
    }

    return {
        label: 'Far',
        value: formatMeters(meters),
        background: 'rgba(9, 0, 108, 0.7)',
        text: Colors.glass.text,
    };
};

const parseDistanceFromString = (distance?: string) => {
    if (!distance) return null;
    const match = distance.trim().match(/([\d.]+)\s*(km|m)/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value)) return null;
    const unit = match[2].toLowerCase();
    return unit === 'km' ? value * 1000 : value;
};

const formatMeters = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const formatTimeAgo = (value?: string | Date | null) => {
    if (!value) return 'recently';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return String(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.round(diffMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 24,
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
    },
    imageWrapper: {
        position: 'relative',
        height: 120,
        backgroundColor: '#333',
    },
    carousel: {
        flex: 1,
    },
    carouselContent: {
        // center?
    },
    image: {
        width: '100%',
        height: 120,
        backgroundColor: '#333',
    },
    statusIcons: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        gap: 6,
    },
    statusIcon: {
        width: 28,
        height: 28,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pageIndicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    distancePill: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    distanceValue: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    appearance: {
        fontSize: 14,
        marginBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    actionButton: {
        width: '47%',
        height: 38,
    },
    innerButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    meta: {
        fontSize: 12,
    },
    metaStrong: {
        fontSize: 12,
        fontWeight: '700',
    },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedActionButton({
    icon,
    popupIcon,
    popupColor,
    onPress,
    isActive,
    iconColor,
    backgroundColor,
    style,
}: {
    icon: string;
    popupIcon?: string;
    popupColor?: string;
    onPress: () => void;
    isActive?: boolean;
    iconColor: string;
    backgroundColor: string;
    style?: StyleProp<ViewStyle>;
}) {
    const scale = useSharedValue(1);
    const popupScale = useSharedValue(0);
    const popupOpacity = useSharedValue(0);
    const popupTransY = useSharedValue(0);

    useEffect(() => {
        if (isActive && popupIcon) {
            // Play popup animation
            popupTransY.value = 0;
            popupOpacity.value = 1;
            popupScale.value = 0.5;

            popupScale.value = withSequence(
                withTiming(1.2, { duration: 200, easing: Easing.out(Easing.ease) }),
                withTiming(1.0, { duration: 100 })
            );

            popupTransY.value = withTiming(-15, { duration: 400, easing: Easing.out(Easing.ease) });

            popupOpacity.value = withSequence(
                withTiming(1, { duration: 200 }),
                withTiming(0, { duration: 300 })
            );
        }
    }, [isActive, popupIcon]);

    const handlePress = () => {
        if (isActive) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSequence(
            withTiming(0.9, { duration: 50 }),
            withTiming(1, { duration: 100 })
        );
        onPress();
    };

    const rStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const rPopupStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: popupScale.value },
            { translateY: popupTransY.value }
        ],
        opacity: popupOpacity.value,
    }));

    return (
        <View style={style}>
            <AnimatedPressable
                style={[styles.innerButton, { backgroundColor }, rStyle]}
                onPress={handlePress}
            >
                <SymbolView name={icon as any} size={18} tintColor={iconColor} />
            </AnimatedPressable>
            {popupIcon && (
                <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }, rPopupStyle]}>
                    <SymbolView name={popupIcon as any} size={24} tintColor={popupColor} />
                </Animated.View>
            )}
        </View>
    );
}
