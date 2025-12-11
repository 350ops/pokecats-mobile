import { LocationAdjustModal } from '@/components/LocationAdjustModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { COLOR_TAGS, KEYWORD_HINTS, RESCUE_FLAGS, getFlagColor } from '@/constants/Report';
import { submitQuickReport } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
    const router = useRouter();
    const { seed } = useLocalSearchParams<{ seed?: string }>();
    const decodedSeed = useMemo(() => {
        if (!seed) return null;
        try {
            return JSON.parse(decodeURIComponent(seed));
        } catch (error) {
            console.warn('Unable to parse seed payload', error);
            return null;
        }
    }, [seed]);

    const [image, setImage] = useState<string | null>(decodedSeed?.photoUri ?? null);
    const [name, setName] = useState<string>(decodedSeed?.name ?? '');
    const [description, setDescription] = useState<string>(decodedSeed?.notes ?? '');
    const [locationDescription, setLocationDescription] = useState<string>(decodedSeed?.address ?? '');
    const [rescueFlags, setRescueFlags] = useState<string[]>(decodedSeed?.rescueFlags ?? []);
    const [colorTag, setColorTag] = useState<string | null>(decodedSeed?.colorTag ?? null);
    const [keywordHint, setKeywordHint] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
        decodedSeed?.latitude && decodedSeed?.longitude
            ? { latitude: Number(decodedSeed.latitude), longitude: Number(decodedSeed.longitude) }
            : null
    );
    const [submitting, setSubmitting] = useState(false);
    const [adjustModalVisible, setAdjustModalVisible] = useState(false);

    useEffect(() => {
        const lowered = description.toLowerCase();
        const hint = KEYWORD_HINTS.find(({ keywords }) => keywords.some((kw) => lowered.includes(kw)));
        setKeywordHint(hint ? hint.hint : null);
    }, [description]);

    useEffect(() => {
        const requestLocation = async () => {
            if (location) return;
            const perm = await Location.requestForegroundPermissionsAsync();
            if (!perm.granted) return;
            const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
            try {
                const [geo] = await Location.reverseGeocodeAsync(coords.coords);
                setLocationDescription(formatAddress(geo));
            } catch (error) {
                console.warn('reverse geocode failed', error);
            }
        };
        requestLocation();
    }, [location]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const toggleFlag = (flagId: string) => {
        setRescueFlags((prev) =>
            prev.includes(flagId) ? prev.filter((id) => id !== flagId) : [...prev, flagId]
        );
    };

    const handleSubmit = async () => {
        if (!location) {
            alert('Please set a location for this sighting.');
            return;
        }
        try {
            setSubmitting(true);
            await submitQuickReport({
                catId: decodedSeed?.selectedCatId ? Number(decodedSeed.selectedCatId) : undefined,
                draftName: name || decodedSeed?.name,
                description,
                photoUri: image ?? decodedSeed?.photoUri,
                latitude: location.latitude,
                longitude: location.longitude,
                locationDescription,
                capturedAt: decodedSeed?.capturedAt,
                rescueFlags,
                colorTag,
            });
            router.back();
        } catch (error) {
            console.error(error);
            alert('Unable to submit the report. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Detailed sighting report</Text>

                <GlassView style={styles.form} intensity={50}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={styles.placeholderText}>Tap to add photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Cat Name (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Park Bench Tabby"
                            placeholderTextColor={Colors.glass.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe exact spot (building, landmark)"
                            placeholderTextColor={Colors.glass.textSecondary}
                            value={locationDescription}
                            onChangeText={setLocationDescription}
                        />
                        <TouchableOpacity style={styles.inlineButton} onPress={() => setAdjustModalVisible(true)}>
                            <SymbolView name="mappin.circle.fill" size={18} tintColor={Colors.primary.green} />
                            <Text style={styles.inlineButtonText}>Adjust pin on map</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Mention color, behavior, injuries, collar info…"
                            placeholderTextColor={Colors.glass.textSecondary}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                            maxLength={600}
                        />
                        <Text style={styles.charCount}>{description.length}/600</Text>
                        {keywordHint && <Text style={styles.guidance}>{keywordHint}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Rescue flags</Text>
                        <View style={styles.flagGrid}>
                            {RESCUE_FLAGS.map((flag) => {
                                const active = rescueFlags.includes(flag.id);
                                return (
                                    <TouchableOpacity
                                        key={flag.id}
                                        style={[
                                            styles.flagChip,
                                            active && { borderColor: getFlagColor(flag.severity), backgroundColor: 'rgba(255,255,255,0.08)' },
                                        ]}
                                        onPress={() => toggleFlag(flag.id)}
                                    >
                                        <SymbolView name={flag.icon as any} size={16} tintColor={getFlagColor(flag.severity)} />
                                        <View>
                                            <Text style={styles.flagTitle}>{flag.label}</Text>
                                            <Text style={styles.flagDescription}>{flag.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Color profile</Text>
                        <View style={styles.colorRow}>
                            {COLOR_TAGS.map((tag) => {
                                const active = tag.id === colorTag;
                                return (
                                    <TouchableOpacity
                                        key={tag.id}
                                        style={[styles.colorChip, active && styles.colorChipActive]}
                                        onPress={() => setColorTag(active ? null : tag.id)}
                                    >
                                        <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>{tag.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.guidanceBox}>
                        <Text style={styles.guidanceTitle}>Quality tips</Text>
                        <Text style={styles.guidanceDetail}>• Mention visible injuries or medical needs</Text>
                        <Text style={styles.guidanceDetail}>• Note collars, ear-tip, or friendliness</Text>
                        <Text style={styles.guidanceDetail}>• Share if food/water was provided</Text>
                    </View>
                </GlassView>

                <GlassButton
                    title={submitting ? 'Submitting…' : 'Submit full report'}
                    icon="paperplane.fill"
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={styles.submitBtn}
                />
                <GlassButton title="Cancel" variant="glass" onPress={() => router.back()} />
            </ScrollView>

            <LocationAdjustModal
                visible={adjustModalVisible}
                coordinate={location ?? undefined}
                onClose={() => setAdjustModalVisible(false)}
                onSave={(coordinate) => setLocation(coordinate)}
            />
        </View>
    );
}

const formatAddress = (geo?: Location.LocationGeocodedAddress) => {
    if (!geo) return '';
    return [geo.name, geo.street, geo.city].filter(Boolean).join(', ');
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
        gap: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.glass.text,
        marginTop: 20,
    },
    form: {
        padding: 20,
        borderRadius: 28,
        gap: 20,
    },
    imagePicker: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 220,
    },
    imagePlaceholder: {
        width: '100%',
        height: 220,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: Colors.glass.textSecondary,
        fontSize: 16,
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        color: Colors.glass.text,
        fontWeight: '600',
        fontSize: 14,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 16,
        padding: 16,
        color: Colors.glass.text,
        borderWidth: 1,
        borderColor: Colors.glass.border,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    inlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    inlineButtonText: {
        color: Colors.primary.green,
        fontWeight: '600',
    },
    charCount: {
        textAlign: 'right',
        color: Colors.glass.textSecondary,
        fontSize: 12,
    },
    guidance: {
        color: Colors.primary.yellow,
        fontSize: 13,
    },
    flagGrid: {
        gap: 12,
    },
    flagChip: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    flagTitle: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    flagDescription: {
        color: Colors.glass.textSecondary,
        fontSize: 12,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    colorChipActive: {
        backgroundColor: Colors.primary.green,
    },
    colorChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    colorChipTextActive: {
        color: '#082A14',
    },
    guidanceBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 18,
        gap: 6,
    },
    guidanceTitle: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    guidanceDetail: {
        color: Colors.glass.textSecondary,
        fontSize: 13,
    },
    submitBtn: {
        marginBottom: 10,
    },
});
