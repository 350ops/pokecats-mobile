import { LocationAdjustModal } from '@/components/LocationAdjustModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { submitQuickReport } from '@/lib/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StatusBadge = 'tnr' | 'healthy' | 'hungry' | 'injured';

const STATUS_BADGES: { id: StatusBadge; label: string; icon: string; color: string }[] = [
    { id: 'tnr', label: 'TNR', icon: 'shield.fill', color: '#8B5CF6' },
    { id: 'healthy', label: 'Healthy', icon: 'checkmark.circle.fill', color: Colors.primary.green },
    { id: 'hungry', label: 'Hungry', icon: 'fork.knife', color: Colors.primary.yellow },
    { id: 'injured', label: 'Injured', icon: 'exclamationmark.triangle.fill', color: '#FF6B6B' },
];

const COLOR_OPTIONS = [
    { id: 'black', label: 'Black' },
    { id: 'white', label: 'White' },
    { id: 'orange', label: 'Orange' },
    { id: 'gray', label: 'Gray' },
    { id: 'tabby', label: 'Tabby' },
    { id: 'calico', label: 'Calico' },
    { id: 'tuxedo', label: 'Tuxedo' },
    { id: 'siamese', label: 'Siamese' },
];

export default function ReportScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const router = useRouter();

    // Form state
    const [name, setName] = useState('');
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [address, setAddress] = useState('');
    const [lastFed, setLastFed] = useState<Date | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedBadges, setSelectedBadges] = useState<StatusBadge[]>([]);
    const [injuryDescription, setInjuryDescription] = useState('');
    const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [locationSheetVisible, setLocationSheetVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const backgroundColor = isDark ? Colors.primary.dark : Colors.light.background;
    const textColor = isDark ? Colors.glass.text : Colors.light.text;
    const secondaryTextColor = isDark ? Colors.glass.textSecondary : Colors.light.icon;
    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

    // Get user's current location on mount
    useEffect(() => {
        (async () => {
            setLoadingLocation(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    try {
                        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
                        setAddress(formatAddress(geo));
                    } catch {
                        // Ignore geocode errors
                    }
                }
            } catch (error) {
                console.warn('Failed to get location', error);
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    const toggleColor = (colorId: string) => {
        setSelectedColors((prev) =>
            prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
        );
    };

    const toggleBadge = (badgeId: StatusBadge) => {
        setSelectedBadges((prev) => {
            if (prev.includes(badgeId)) {
                return prev.filter((b) => b !== badgeId);
            }
            // If selecting healthy, remove hungry/injured and vice versa
            if (badgeId === 'healthy') {
                return [...prev.filter((b) => b !== 'hungry' && b !== 'injured'), badgeId];
            }
            if (badgeId === 'hungry' || badgeId === 'injured') {
                return [...prev.filter((b) => b !== 'healthy'), badgeId];
            }
            return [...prev, badgeId];
        });
    };

    const pickPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setPhoto(result.assets[0]);
        }
    };

    const handleTimeChange = (_: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setLastFed(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('Please enter a name for the cat.');
            return;
        }
        if (!location) {
            alert('Please set the cat\'s location.');
            return;
        }

        try {
            setLoading(true);
            
            // Determine status based on badges
            let status = 'Healthy';
            if (selectedBadges.includes('injured')) {
                status = 'Needs Help';
            } else if (selectedBadges.includes('hungry')) {
                status = 'Hungry';
            }

            await submitQuickReport({
                draftName: name.trim(),
                description: selectedBadges.includes('injured') ? injuryDescription : undefined,
                photoUri: photo?.uri,
                latitude: location.latitude,
                longitude: location.longitude,
                locationDescription: address,
                capturedAt: new Date().toISOString(),
                rescueFlags: selectedBadges.includes('injured') ? ['injured'] : [],
                colorTag: selectedColors[0] || null,
                tnrStatus: selectedBadges.includes('tnr'),
                status,
                lastFed: lastFed?.toISOString(),
            });

            alert('Cat profile created successfully!');
            router.back();
        } catch (error) {
            console.error(error);
            alert('Failed to create cat profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isInjured = selectedBadges.includes('injured');

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Photo */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Photo</Text>
                    <Pressable onPress={pickPhoto} style={[styles.photoPickerBox, { borderColor: inputBorder }]}>
                        {photo ? (
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <SymbolView name="photo.on.rectangle" size={40} tintColor={secondaryTextColor} />
                                <Text style={[styles.photoPlaceholderText, { color: secondaryTextColor }]}>
                                    Tap to select photo
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Name */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Name *</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                        placeholder="Enter cat's name"
                        placeholderTextColor={secondaryTextColor}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Color */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Color</Text>
                    <View style={styles.chipGrid}>
                        {COLOR_OPTIONS.map((color) => {
                            const active = selectedColors.includes(color.id);
                            return (
                                <Pressable
                                    key={color.id}
                                    onPress={() => toggleColor(color.id)}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: active ? Colors.primary.green : inputBg },
                                        { borderColor: active ? Colors.primary.green : inputBorder },
                                    ]}
                                >
                                    <Text style={[styles.chipText, { color: active ? '#0D1A0D' : textColor }]}>
                                        {color.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Location *</Text>
                    <Pressable
                        onPress={() => setLocationSheetVisible(true)}
                        style={[styles.locationBox, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    >
                        <SymbolView name="mappin.circle.fill" size={24} tintColor={Colors.primary.green} />
                        <View style={styles.locationTextWrapper}>
                            {loadingLocation ? (
                                <ActivityIndicator size="small" color={Colors.primary.green} />
                            ) : location ? (
                                <>
                                    <Text style={[styles.locationText, { color: textColor }]}>
                                        {address || 'Location set'}
                                    </Text>
                                    <Text style={[styles.locationCoords, { color: secondaryTextColor }]}>
                                        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                                    </Text>
                                </>
                            ) : (
                                <Text style={[styles.locationText, { color: secondaryTextColor }]}>
                                    Tap to set location on map
                                </Text>
                            )}
                        </View>
                        <SymbolView name="chevron.right" size={16} tintColor={secondaryTextColor} />
                    </Pressable>
                </View>

                {/* Last Fed */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Last Fed</Text>
                    <Pressable
                        onPress={() => setShowTimePicker(true)}
                        style={[styles.timePickerBox, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    >
                        <SymbolView name="clock.fill" size={20} tintColor={Colors.primary.yellow} />
                        <Text style={[styles.timePickerText, { color: lastFed ? textColor : secondaryTextColor }]}>
                            {lastFed ? lastFed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'}
                        </Text>
                    </Pressable>
                    {showTimePicker && (
                        <DateTimePicker
                            value={lastFed || new Date()}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={handleTimeChange}
                        />
                    )}
                </View>

                {/* Status Badges */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Status</Text>
                    <View style={styles.chipGrid}>
                        {STATUS_BADGES.map((badge) => {
                            const active = selectedBadges.includes(badge.id);
                            return (
                                <Pressable
                                    key={badge.id}
                                    onPress={() => toggleBadge(badge.id)}
                                    style={[
                                        styles.badgeChip,
                                        { backgroundColor: active ? badge.color : inputBg },
                                        { borderColor: active ? badge.color : inputBorder },
                                    ]}
                                >
                                    <SymbolView
                                        name={badge.icon as any}
                                        size={16}
                                        tintColor={active ? '#FFFFFF' : badge.color}
                                    />
                                    <Text style={[styles.badgeChipText, { color: active ? '#FFFFFF' : textColor }]}>
                                        {badge.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Injury Description (conditional) */}
                {isInjured && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>
                            Injury Description *
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                styles.multilineInput,
                                { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                            ]}
                            placeholder="Describe the injury or condition..."
                            placeholderTextColor={secondaryTextColor}
                            multiline
                            value={injuryDescription}
                            onChangeText={setInjuryDescription}
                        />
                    </View>
                )}
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.submitContainer, { paddingBottom: insets.bottom + 16 }]}>
                <GlassButton
                    title={loading ? 'Saving...' : 'Save Cat Profile'}
                    icon="checkmark.circle.fill"
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={loading || !name.trim() || !location}
                    style={{ width: '100%' }}
                />
            </View>

            {/* Location Modal */}
            <LocationAdjustModal
                visible={locationSheetVisible}
                coordinate={location || undefined}
                onClose={() => setLocationSheetVisible(false)}
                onSave={(coordinate) => {
                    setLocation(coordinate);
                    // Try to reverse geocode the new location
                    Location.reverseGeocodeAsync(coordinate)
                        .then(([geo]) => setAddress(formatAddress(geo)))
                        .catch(() => setAddress(''));
                }}
            />
        </KeyboardAvoidingView>
    );
}

const formatAddress = (geo?: Location.LocationGeocodedAddress) => {
    if (!geo) return '';
    return [geo.name, geo.street, geo.city].filter(Boolean).join(', ');
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 24,
    },
    section: {
        gap: 10,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    photoPickerBox: {
        height: 180,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    photoPlaceholderText: {
        fontSize: 14,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    badgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    locationTextWrapper: {
        flex: 1,
    },
    locationText: {
        fontSize: 15,
    },
    locationCoords: {
        fontSize: 12,
        marginTop: 2,
    },
    timePickerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    timePickerText: {
        fontSize: 16,
    },
    submitContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
});
