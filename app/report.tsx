import { LocationAdjustModal } from '@/components/LocationAdjustModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { CAT_COLORS, CAT_PATTERNS, CatColor, CatPattern } from '@/constants/CatAppearance';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { submitQuickReport } from '@/lib/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
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
type CatSex = 'male' | 'female' | 'unknown';
type CatAge = 'kitten' | 'adult' | 'senior' | 'unknown';

const STATUS_BADGES: { id: StatusBadge; label: string; icon: string; color: string }[] = [
    { id: 'tnr', label: 'TNR', icon: 'shield.fill', color: '#8B5CF6' },
    { id: 'healthy', label: 'Healthy', icon: 'checkmark.circle.fill', color: Colors.primary.green },
    { id: 'hungry', label: 'Hungry', icon: 'fork.knife', color: Colors.primary.yellow },
    { id: 'injured', label: 'Injured', icon: 'exclamationmark.triangle.fill', color: '#FF6B6B' },
];

const SEX_OPTIONS: { value: CatSex; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Unknown' },
];

const AGE_OPTIONS: { value: CatAge; label: string }[] = [
    { value: 'kitten', label: 'Kitten' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' },
];

export default function ReportScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const router = useRouter();

    // Form state
    const [name, setName] = useState('');
    const [primaryColor, setPrimaryColor] = useState<CatColor | ''>('');
    const [pattern, setPattern] = useState<CatPattern | ''>('');
    const [sex, setSex] = useState<CatSex>('unknown');
    const [age, setAge] = useState<CatAge>('adult');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [address, setAddress] = useState('');
    const [lastFed, setLastFed] = useState<Date | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedBadges, setSelectedBadges] = useState<StatusBadge[]>([]);
    const [notes, setNotes] = useState('');
    const [needsAttention, setNeedsAttention] = useState(false);
    const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [locationSheetVisible, setLocationSheetVisible] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [patternPickerOpen, setPatternPickerOpen] = useState(false);
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
        if (!primaryColor) {
            alert('Please select the main fur color.');
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
                description: notes.trim() || undefined,
                photoUri: photo?.uri,
                latitude: location.latitude,
                longitude: location.longitude,
                locationDescription: address,
                capturedAt: new Date().toISOString(),
                rescueFlags: selectedBadges.includes('injured') ? ['injured'] : [],
                colorTag: primaryColor || null,
                pattern: pattern || null,
                sex,
                approximateAge: age,
                tnrStatus: selectedBadges.includes('tnr'),
                status,
                lastFed: lastFed?.toISOString(),
                needsAttention,
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
    const selectedColorLabel = CAT_COLORS.find(c => c.value === primaryColor)?.label;
    const selectedPatternLabel = CAT_PATTERNS.find(p => p.value === pattern)?.label;

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
                    <View style={styles.avatarSection}>
                        <Pressable onPress={pickPhoto} style={styles.avatarPressable}>
                            <LinearGradient
                                colors={['#0084ff57', '#CD4486']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.avatarGradient}
                            >
                                <View style={[styles.avatarInner, { backgroundColor }]}>
                                    {photo ? (
                                        <Image source={{ uri: photo.uri }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <SymbolView name="camera.fill" size={32} tintColor={secondaryTextColor} />
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>
                            <View style={[styles.editBadge, { backgroundColor: '#0055ffff' }]}>
                                <SymbolView name="plus" size={14} tintColor="#fff" />
                            </View>
                        </Pressable>
                        <Pressable onPress={pickPhoto}>
                            <Text style={{ color: '#006effff', fontWeight: '600', marginTop: 12 }}>
                                {photo ? 'Change Photo' : 'Add Photo'}
                            </Text>
                        </Pressable>
                    </View>
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

                {/* Main Fur Color */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Main Fur Color *</Text>
                    <Text style={[styles.helperText, { color: secondaryTextColor }]}>Choose the dominant color you see</Text>
                    <Pressable
                        onPress={() => setColorPickerOpen(true)}
                        style={[styles.selectBox, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    >
                        {primaryColor ? (
                            <View style={styles.selectContent}>
                                {CAT_COLORS.find(c => c.value === primaryColor)?.hex && (
                                    <View style={[styles.colorDot, { backgroundColor: CAT_COLORS.find(c => c.value === primaryColor)?.hex ?? '#ccc' }]} />
                                )}
                                <Text style={[styles.selectText, { color: textColor }]}>{selectedColorLabel}</Text>
                            </View>
                        ) : (
                            <Text style={[styles.selectText, { color: secondaryTextColor }]}>Select color</Text>
                        )}
                        <SymbolView name="chevron.down" size={16} tintColor={secondaryTextColor} />
                    </Pressable>
                </View>

                {/* Fur Pattern */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Fur Pattern</Text>
                    <Text style={[styles.helperText, { color: secondaryTextColor }]}>Optional, but helpful for identification</Text>
                    <Pressable
                        onPress={() => setPatternPickerOpen(true)}
                        style={[styles.selectBox, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    >
                        <Text style={[styles.selectText, { color: pattern ? textColor : secondaryTextColor }]}>
                            {selectedPatternLabel || 'Select pattern'}
                        </Text>
                        <SymbolView name="chevron.down" size={16} tintColor={secondaryTextColor} />
                    </Pressable>
                </View>

                {/* Sex */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Sex</Text>
                    <View style={styles.segmentedControl}>
                        {SEX_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => setSex(option.value)}
                                style={[
                                    styles.segmentedButton,
                                    { backgroundColor: sex === option.value ? Colors.primary.blue : inputBg },
                                    { borderColor: sex === option.value ? Colors.primary.blue : inputBorder },
                                ]}
                            >
                                <Text style={[styles.segmentedText, { color: sex === option.value ? '#FFFFFF' : textColor }]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Age */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Approximate Age</Text>
                    <View style={styles.segmentedControl}>
                        {AGE_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => setAge(option.value)}
                                style={[
                                    styles.segmentedButton,
                                    { backgroundColor: age === option.value ? Colors.primary.blue : inputBg },
                                    { borderColor: age === option.value ? Colors.primary.blue : inputBorder },
                                ]}
                            >
                                <Text style={[styles.segmentedText, { color: age === option.value ? '#FFFFFF' : textColor }]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
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

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>Notes</Text>
                    <Text style={[styles.helperText, { color: secondaryTextColor }]}>Health, behavior, or identification details</Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            styles.multilineInput,
                            { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                        ]}
                        placeholder="e.g., Visible limp, friendly, ear tipped..."
                        placeholderTextColor={secondaryTextColor}
                        multiline
                        maxLength={200}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                {/* Needs Attention Toggle */}
                <Pressable
                    onPress={() => setNeedsAttention(!needsAttention)}
                    style={[
                        styles.attentionToggle,
                        {
                            backgroundColor: needsAttention ? 'rgba(255,107,107,0.15)' : inputBg,
                            borderColor: needsAttention ? '#FF6B6B' : inputBorder,
                        },
                    ]}
                >
                    <View style={styles.attentionContent}>
                        <SymbolView
                            name={needsAttention ? 'exclamationmark.triangle.fill' : 'exclamationmark.triangle'}
                            size={20}
                            tintColor={needsAttention ? '#FF6B6B' : secondaryTextColor}
                        />
                        <View>
                            <Text style={[styles.attentionTitle, { color: textColor }]}>Needs Attention?</Text>
                            <Text style={[styles.attentionSubtitle, { color: secondaryTextColor }]}>
                                This cat may need help
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.checkbox,
                        {
                            backgroundColor: needsAttention ? '#FF6B6B' : 'transparent',
                            borderColor: needsAttention ? '#FF6B6B' : inputBorder,
                        },
                    ]}>
                        {needsAttention && <SymbolView name="checkmark" size={12} tintColor="#FFFFFF" />}
                    </View>
                </Pressable>
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.submitContainer, { paddingBottom: insets.bottom + 16 }]}>
                <GlassButton
                    title={loading ? 'Saving...' : 'Save Cat Profile'}
                    icon="checkmark.circle.fill"
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={loading || !name.trim() || !location || !primaryColor}
                    style={{ width: '100%' }}
                />
            </View>

            {/* Color Picker Modal */}
            <Modal
                visible={colorPickerOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setColorPickerOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setColorPickerOpen(false)} />
                <View style={styles.modalSheet}>
                    <GlassView style={[styles.modalCard, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]} intensity={isDark ? 40 : 0}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Main Fur Color</Text>
                            <Pressable onPress={() => setColorPickerOpen(false)} style={styles.modalClose}>
                                <Text style={{ color: Colors.primary.blue, fontWeight: '600' }}>Done</Text>
                            </Pressable>
                        </View>
                        <ScrollView contentContainerStyle={styles.pickerList}>
                            {CAT_COLORS.map((color) => (
                                <Pressable
                                    key={color.value}
                                    onPress={() => {
                                        setPrimaryColor(color.value);
                                        setColorPickerOpen(false);
                                    }}
                                    style={({ pressed }) => [
                                        styles.pickerRow,
                                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                                        pressed && { opacity: 0.8 },
                                    ]}
                                >
                                    <View style={styles.pickerRowContent}>
                                        {color.hex && (
                                            <View style={[styles.colorDot, { backgroundColor: color.hex }]} />
                                        )}
                                        <Text style={[styles.pickerRowText, { color: textColor }]}>{color.label}</Text>
                                    </View>
                                    {primaryColor === color.value && (
                                        <SymbolView name="checkmark" size={18} tintColor={Colors.primary.blue} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </GlassView>
                </View>
            </Modal>

            {/* Pattern Picker Modal */}
            <Modal
                visible={patternPickerOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setPatternPickerOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setPatternPickerOpen(false)} />
                <View style={styles.modalSheet}>
                    <GlassView style={[styles.modalCard, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]} intensity={isDark ? 40 : 0}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Fur Pattern</Text>
                            <Pressable onPress={() => setPatternPickerOpen(false)} style={styles.modalClose}>
                                <Text style={{ color: Colors.primary.blue, fontWeight: '600' }}>Done</Text>
                            </Pressable>
                        </View>
                        <ScrollView contentContainerStyle={styles.pickerList}>
                            <Pressable
                                onPress={() => {
                                    setPattern('');
                                    setPatternPickerOpen(false);
                                }}
                                style={({ pressed }) => [
                                    styles.pickerRow,
                                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                <Text style={[styles.pickerRowText, { color: secondaryTextColor }]}>None</Text>
                                {!pattern && (
                                    <SymbolView name="checkmark" size={18} tintColor={Colors.primary.blue} />
                                )}
                            </Pressable>
                            {CAT_PATTERNS.map((p) => (
                                <Pressable
                                    key={p.value}
                                    onPress={() => {
                                        setPattern(p.value);
                                        setPatternPickerOpen(false);
                                    }}
                                    style={({ pressed }) => [
                                        styles.pickerRow,
                                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                                        pressed && { opacity: 0.8 },
                                    ]}
                                >
                                    <Text style={[styles.pickerRowText, { color: textColor }]}>{p.label}</Text>
                                    {pattern === p.value && (
                                        <SymbolView name="checkmark" size={18} tintColor={Colors.primary.blue} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </GlassView>
                </View>
            </Modal>

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
    helperText: {
        fontSize: 12,
        marginTop: -6,
    },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    selectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectText: {
        fontSize: 16,
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    segmentedControl: {
        flexDirection: 'row',
        gap: 10,
    },
    segmentedButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    segmentedText: {
        fontSize: 14,
        fontWeight: '600',
    },
    attentionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    attentionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attentionTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    attentionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalCard: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    modalClose: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    pickerList: {
        paddingBottom: 40,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerRowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pickerRowText: {
        fontSize: 16,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    avatarPressable: {
        position: 'relative',
    },
    avatarGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 110,
        height: 110,
        borderRadius: 55,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
