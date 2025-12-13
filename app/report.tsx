import { LocationAdjustModal } from '@/components/LocationAdjustModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { COLOR_TAGS, KEYWORD_HINTS, RESCUE_FLAGS, getFlagColor } from '@/constants/Report';
import { useTheme } from '@/context/ThemeContext';
import { getCats, submitQuickReport } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Suggestion = {
    cat: any;
    distance: number;
    score: number;
};

export default function ReportScreen() {
    const { isDark } = useTheme();
    const router = useRouter();
    const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [capturedAt, setCapturedAt] = useState<Date | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string>('');
    const [cats, setCats] = useState<any[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [rescueFlags, setRescueFlags] = useState<string[]>([]);
    const [colorTag, setColorTag] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [keywordHint, setKeywordHint] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [locationSheetVisible, setLocationSheetVisible] = useState(false);
    const [autoCapturing, setAutoCapturing] = useState(false);
    const hasAttemptedCapture = useRef(false);

    const backgroundColor = isDark ? Colors.primary.dark : Colors.light.background;

    useFocusEffect(
        useCallback(() => {
            if (!hasAttemptedCapture.current) {
                hasAttemptedCapture.current = true;
                startQuickCapture();
            }
        }, [])
    );

    useEffect(() => {
        getCats().then(setCats);
    }, []);

    useEffect(() => {
        const lowered = notes.toLowerCase();
        const hint = KEYWORD_HINTS.find(({ keywords }) =>
            keywords.some((keyword) => lowered.includes(keyword))
        );
        setKeywordHint(hint ? hint.hint : null);
    }, [notes]);

    const suggestions: Suggestion[] = useMemo(() => {
        if (!location || !cats.length) return [];
        return cats
            .map((cat) => {
                const distance = computeDistanceMeters(
                    location.coords.latitude,
                    location.coords.longitude,
                    cat.latitude,
                    cat.longitude
                );
                const recencyScore = isRecentlySeen(cat.lastSighted) ? 1 : 0;
                const colorScore = colorTag && Array.isArray(cat.colorProfile) && cat.colorProfile.includes(colorTag) ? 1 : 0;
                const proximityScore = distance < 400 ? 2 : distance < 800 ? 1 : 0;
                const score = recencyScore + colorScore + proximityScore;
                return { cat, distance, score };
            })
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [cats, location, colorTag]);

    const selectedCat = selectedCatId ? cats.find((cat) => Number(cat.id) === selectedCatId) : null;

    const startQuickCapture = useCallback(async () => {
        try {
            setAutoCapturing(true);
            const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPerm.granted) {
                alert('Camera permission is required to submit a quick report.');
                return;
            }
            const locationPerm = await Location.requestForegroundPermissionsAsync();
            const capture = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.6,
                base64: false,
            });
            if (capture.canceled) {
                return;
            }
            const asset = capture.assets[0];
            setPhoto(asset);
            setCapturedAt(new Date());
            if (locationPerm.granted) {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                setLocation(loc);
                try {
                    const [geo] = await Location.reverseGeocodeAsync(loc.coords);
                    setAddress(formatAddress(geo));
                } catch (error) {
                    console.warn('Reverse geocode failed', error);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Unable to open the camera. Please try again.');
        } finally {
            setAutoCapturing(false);
        }
    }, []);

    const handleFlagToggle = (flagId: string) => {
        setRescueFlags((prev) =>
            prev.includes(flagId) ? prev.filter((id) => id !== flagId) : [...prev, flagId]
        );
    };

    const handleQuickSubmit = async () => {
        if (!photo || !location) {
            alert('Capture a photo and location first.');
            return;
        }
        try {
            setLoading(true);
            setStatusMessage(null);
            await submitQuickReport({
                catId: selectedCatId ?? undefined,
                draftName: selectedCat?.name,
                description: notes,
                photoUri: photo.uri,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                locationDescription: address,
                capturedAt: capturedAt?.toISOString(),
                rescueFlags,
                colorTag,
            });
            setStatusMessage('Quick report submitted. Thank you!');
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Failed to submit report. Try again in a moment.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNotes('');
        setRescueFlags([]);
        setColorTag(null);
        setSelectedCatId(null);
        setPhoto(null);
        setCapturedAt(null);
        setAddress('');
        hasAttemptedCapture.current = false;
    };

    const handleAddDetails = () => {
        if (!photo || !location) {
            alert('Capture info first.');
            return;
        }
        const payload = {
            photoUri: photo.uri,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address,
            capturedAt: capturedAt?.toISOString(),
            rescueFlags,
            colorTag,
            selectedCatId,
            notes,
        };
        router.push({
            pathname: '/modal',
            params: { seed: encodeURIComponent(JSON.stringify(payload)) },
        });
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {photo ? (
                <>
                    <Image source={{ uri: photo.uri }} style={styles.preview} />
                    <GlassView style={styles.sheet} intensity={85}>
                        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Captured</Text>
                                <Text style={styles.sectionValue}>{capturedAt ? capturedAt.toLocaleString() : 'Just now'}</Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Location</Text>
                                <Text style={styles.sectionValue}>{address || 'Using GPS coordinates'}</Text>
                                <Pressable style={styles.inlineButton} onPress={() => setLocationSheetVisible(true)}>
                                    <SymbolView name="mappin.circle.fill" size={18} tintColor={Colors.primary.green} />
                                    <Text style={styles.inlineButtonText}>Adjust pin on map</Text>
                                </Pressable>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Rescue flags</Text>
                                <View style={styles.flagGrid}>
                                    {RESCUE_FLAGS.map((flag) => {
                                        const active = rescueFlags.includes(flag.id);
                                        return (
                                            <Pressable
                                                key={flag.id}
                                                style={[
                                                    styles.flagChip,
                                                    { borderColor: active ? getFlagColor(flag.severity) : 'rgba(255,255,255,0.1)' },
                                                    active && { backgroundColor: 'rgba(255,255,255,0.1)' },
                                                ]}
                                                onPress={() => handleFlagToggle(flag.id)}
                                            >
                                                <SymbolView name={flag.icon as any} size={16} tintColor={getFlagColor(flag.severity)} />
                                                <Text style={styles.flagChipText}>{flag.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Color profile</Text>
                                <View style={styles.flagGrid}>
                                    {COLOR_TAGS.map((color) => {
                                        const active = color.id === colorTag;
                                        return (
                                            <Pressable
                                                key={color.id}
                                                style={[
                                                    styles.colorChip,
                                                    active && { backgroundColor: Colors.primary.green },
                                                ]}
                                                onPress={() => setColorTag(active ? null : color.id)}
                                            >
                                                <Text style={[styles.colorChipText, active && { color: '#0D1A0D' }]}>{color.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Is this an existing cat?</Text>
                                {suggestions.length ? (
                                    suggestions.map(({ cat, distance }) => {
                                        const active = selectedCatId === cat.id;
                                        return (
                                            <Pressable
                                                key={cat.id}
                                                style={[
                                                    styles.suggestionCard,
                                                    active && styles.suggestionCardActive,
                                                ]}
                                                onPress={() => setSelectedCatId(cat.id)}
                                            >
                                                <View>
                                                    <Text style={styles.suggestionTitle}>{cat.name}</Text>
                                                    <Text style={styles.suggestionMeta}>
                                                        {formatDistance(distance)} • Seen {getTimeAgo(cat.lastSighted)}
                                                    </Text>
                                                </View>
                                                {active && <SymbolView name="checkmark.circle.fill" size={22} tintColor={Colors.primary.green} />}
                                            </Pressable>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.sectionValue}>No close matches nearby.</Text>
                                )}
                                <Pressable style={styles.inlineButton} onPress={() => setSelectedCatId(null)}>
                                    <SymbolView name="plus.circle" size={18} tintColor={Colors.glass.text} />
                                    <Text style={styles.inlineButtonText}>Report as new cat</Text>
                                </Pressable>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Notes</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Share quick details (limping, collar, etc.)"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    multiline
                                    value={notes}
                                    onChangeText={setNotes}
                                />
                                <Text style={styles.charCount}>{notes.length}/280</Text>
                                {keywordHint && (
                                    <Text style={styles.hintText}>{keywordHint}</Text>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.actionRow}>
                            <GlassButton
                                title="Looks okay"
                                icon="paperplane.fill"
                                variant="glass"
                                onPress={handleQuickSubmit}
                                disabled={loading}
                                style={{ flex: 1 }}
                            />
                            <GlassButton
                                title="Add details"
                                icon="square.and.pencil"
                                variant="primary"
                                onPress={handleAddDetails}
                                disabled={loading}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <GlassButton
                            title="Retake photo"
                            icon="camera.rotate"
                            variant="glass"
                            onPress={startQuickCapture}
                        />
                    </GlassView>
                </>
            ) : (
                <View style={styles.placeholder}>
                    {autoCapturing ? (
                        <>
                            <ActivityIndicator color={Colors.primary.green} />
                            <Text style={styles.placeholderText}>Opening camera…</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.placeholderText}>Tap below to start a quick report.</Text>
                            <GlassButton title="Launch camera" icon="camera.fill" onPress={startQuickCapture} />
                        </>
                    )}
                    {statusMessage && <Text style={styles.hintText}>{statusMessage}</Text>}
                </View>
            )}

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary.green} />
                    <Text style={styles.loadingText}>Submitting report…</Text>
                </View>
            )}

            <LocationAdjustModal
                visible={locationSheetVisible}
                coordinate={
                    location
                        ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
                        : undefined
                }
                onClose={() => setLocationSheetVisible(false)}
                onSave={(coordinate) => {
                    if (location) {
                        setLocation({ ...location, coords: { ...location.coords, ...coordinate } });
                    }
                }}
            />
        </KeyboardAvoidingView>
    );
}

const isRecentlySeen = (value?: string | Date | null) => {
    if (!value) return false;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
};

const computeDistanceMeters = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

const deg2rad = (deg: number) => (deg * Math.PI) / 180;

const formatAddress = (geo?: Location.LocationGeocodedAddress) => {
    if (!geo) return '';
    return [geo.name, geo.street, geo.city].filter(Boolean).join(', ');
};

const formatDistance = (meters: number) => {
    if (!isFinite(meters)) return 'Unknown';
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const getTimeAgo = (value?: string | Date | null) => {
    if (!value) return 'Unknown';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Unknown';
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    preview: {
        flex: 1,
        width: '100%',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        gap: 16,
    },
    sheetContent: {
        gap: 18,
        paddingBottom: 10,
    },
    section: {
        gap: 6,
    },
    sectionLabel: {
        color: Colors.glass.text,
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    sectionValue: {
        color: Colors.glass.text,
        fontSize: 16,
    },
    flagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    flagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    flagChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    colorChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    colorChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    suggestionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: 8,
    },
    suggestionCardActive: {
        borderWidth: 1,
        borderColor: Colors.primary.green,
    },
    suggestionTitle: {
        color: Colors.glass.text,
        fontSize: 16,
        fontWeight: '600',
    },
    suggestionMeta: {
        color: Colors.glass.textSecondary,
        fontSize: 12,
    },
    textInput: {
        minHeight: 90,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        color: Colors.glass.text,
    },
    charCount: {
        textAlign: 'right',
        color: Colors.glass.textSecondary,
        fontSize: 12,
    },
    hintText: {
        color: Colors.primary.yellow,
        fontSize: 13,
        marginTop: 6,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    placeholderText: {
        color: Colors.glass.text,
        marginBottom: 12,
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    inlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    inlineButtonText: {
        color: Colors.primary.green,
        fontWeight: '600',
    },
});
