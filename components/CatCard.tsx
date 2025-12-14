import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { addCatPhoto, addSighting, getCatPhotos, uploadCatImage } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassView } from './ui/GlassView';

// Compatible definition with DB and Map
interface Cat {
    id: number | string;
    name: string;
    image?: string;
    breed?: string;
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

    useEffect(() => {
        setLastSighted(cat.lastSighted);
    }, [cat.lastSighted]);

    useEffect(() => {
        // Fetch photos on mount
        const loadPhotos = async () => {
            const dbPhotos = await getCatPhotos(cat.id);
            if (dbPhotos && dbPhotos.length > 0) {
                setPhotos(dbPhotos.map(p => p.url));
            } else if (cat.image) {
                setPhotos([cat.image]);
            }
        };
        loadPhotos();
    }, [cat.id, cat.image]);

    const handleSeen = async () => {
        try {
            setLastSighted(new Date().toISOString()); // Optimistic
            await addSighting(cat.id);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to record sighting.');
        }
    };

    const handleEdit = () => {
        router.push(`/cat/${cat.id}/edit`);
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
                    await addCatPhoto(cat.id, publicUrl);
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
                <Text style={[styles.breed, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]} numberOfLines={1}>
                    {cat.breed}
                </Text>

                {/* New Action Buttons */}
                <View style={styles.actionRow}>
                    <Pressable style={styles.actionButton} onPress={handleSeen}>
                        <SymbolView name="eye.fill" size={16} tintColor={Colors.primary.blue} />
                        <Text style={[styles.actionButtonText, { color: Colors.primary.blue }]}>Seen</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handleEdit}>
                        <SymbolView name="pencil" size={16} tintColor={isDark ? Colors.glass.textSecondary : Colors.light.icon} />
                        <Text style={[styles.actionButtonText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handlePhoto}>
                        <SymbolView name="camera.fill" size={16} tintColor={isDark ? Colors.glass.textSecondary : Colors.light.icon} />
                        <Text style={[styles.actionButtonText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Photo</Text>
                    </Pressable>
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
        height: 200,
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
        height: 200,
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
        padding: 16,
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
    breed: {
        fontSize: 14,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
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
