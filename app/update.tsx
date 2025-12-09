import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { addFeeding, getCat, updateCat } from '@/lib/database';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function UpdateScreen() {
    const { id } = useLocalSearchParams();
    const [cat, setCat] = useState<any>(null); // Database record
    const [loading, setLoading] = useState(true);

    // New Feeding State
    const [foodType, setFoodType] = useState('Dry Food');
    const [foodAmount, setFoodAmount] = useState('Bowl');
    const [sharedFeeding, setSharedFeeding] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [justFed, setJustFed] = useState(false);

    useEffect(() => {
        if (id) {
            // Fetch cat from DB
            const fetchCat = async () => {
                const catData = await getCat(Number(id));
                setCat(catData);
                setLoading(false);
            };
            fetchCat();
        }
    }, [id]);

    const handleUpdateLocation = async () => {
        setUpdatingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            if (cat) {
                // Update local state visuals (optimistic)
                setCat({ ...cat, latitude: location.coords.latitude, longitude: location.coords.longitude });
                // In a real app we might store this in a temporary 'updates' object before submitting
            }
        } catch (e) {
            console.error(e);
            alert('Failed to get location');
        } finally {
            setUpdatingLocation(false);
        }
    };

    const handleSubmit = async () => {
        if (!cat) return;

        const updates: any = {};

        // If we updated location (we would need to track if it changed, but let's assume we send current state if changed)
        // For simplicity, let's just use the current cat state assuming it was updated by the button above
        // NOTE: In a robust app, we'd store 'pendingLocation' separate from 'cat'. 
        // But here, let's re-fetch location or just trust the user tapped the button.
        // Actually, let's fix the logic: The button above updates the 'cat' state.

        // Ideally we only send if changed.
        updates.latitude = cat.latitude;
        updates.longitude = cat.longitude;

        // Always update last sighted on any update action? Or strictly if location changed?
        // Requirement: "Update globally the 'Last seen' of the cat"
        updates.lastSighted = new Date().toISOString();

        if (justFed) {
            updates.lastFed = new Date().toISOString();
        }

        await updateCat(cat.id, updates);

        if (justFed) {
            await addFeeding(cat.id, foodType, foodAmount, sharedFeeding);
        }

        router.back();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary.green} />
            </View>
        );
    }

    if (!cat) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Cat not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

            <View style={styles.header}>
                <Text style={styles.title}>Update {cat.name}</Text>
                <Text style={styles.subtitle}>Help keep the community informed</Text>
            </View>

            <GlassView style={styles.card} intensity={40}>
                {/* Cat Info Preview */}
                <View style={styles.previewRow}>
                    <Image source={{ uri: cat.image }} style={styles.thumb} />
                    <View>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.status}>{cat.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Location Section */}
                <Text style={styles.sectionLabel}>Location</Text>
                <Text style={styles.helperText}>
                    Move the cat marker to your current location if it moved.
                </Text>
                <GlassButton
                    title={updatingLocation ? "Getting Location..." : "Update to My Location"}
                    icon="location.fill"
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
                    style={{ marginBottom: 20 }}
                />

                {/* Feeding Section */}
                <Text style={styles.sectionLabel}>Feeding</Text>
                <GlassButton
                    title={justFed ? "Yes, I just fed it" : "Gave food?"}
                    icon={justFed ? "checkmark.circle.fill" : "circle"}
                    variant={justFed ? "primary" : "glass"}
                    onPress={() => setJustFed(!justFed)}
                    style={{ marginBottom: 16 }}
                />

                {justFed && (
                    <GlassView intensity={40} style={{ padding: 16, borderRadius: 20, gap: 16 }}>
                        <View>
                            <Text style={styles.subLabel}>What kind of food?</Text>
                            <View style={styles.optionRow}>
                                {['Wet Food', 'Dry Food', 'Treats'].map((type) => (
                                    <Pressable
                                        key={type}
                                        onPress={() => setFoodType(type)}
                                        style={[styles.optionChip, foodType === type && styles.optionChipSelected]}
                                    >
                                        <Text style={[styles.optionText, foodType === type && styles.optionTextSelected]}>{type}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View>
                            <Text style={styles.subLabel}>How much?</Text>
                            <View style={styles.optionRow}>
                                {['Snack', 'Bowl', 'Feast'].map((amt) => (
                                    <Pressable
                                        key={amt}
                                        onPress={() => setFoodAmount(amt)}
                                        style={[styles.optionChip, foodAmount === amt && styles.optionChipSelected]}
                                    >
                                        <Text style={[styles.optionText, foodAmount === amt && styles.optionTextSelected]}>{amt}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <Pressable
                            style={styles.checkboxRow}
                            onPress={() => setSharedFeeding(!sharedFeeding)}
                        >
                            <SymbolView
                                name={sharedFeeding ? "checkmark.square.fill" : "square"}
                                tintColor={sharedFeeding ? Colors.primary.green : Colors.glass.text}
                                size={24}
                            />
                            <Text style={styles.checkboxLabel}>Shared with other cats</Text>
                        </Pressable>
                    </GlassView>
                )}
            </GlassView>

            <View style={styles.footer}>
                <GlassButton
                    title="Save Update"
                    variant="primary"
                    onPress={handleSubmit}
                    style={{ width: '100%' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
        padding: 20,
    },
    header: {
        marginTop: 60,
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.glass.textSecondary,
        marginTop: 4,
    },
    card: {
        padding: 20,
        borderRadius: 24,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    thumb: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
    },
    catName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    status: {
        color: Colors.primary.green,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.glass.border,
        marginVertical: 20,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 12,
        marginTop: 24,
    },
    subLabel: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
        marginBottom: 8,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    optionChipSelected: {
        backgroundColor: Colors.primary.green,
        borderColor: Colors.primary.green,
    },
    optionText: {
        color: Colors.glass.text,
        fontSize: 14,
    },
    optionTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    checkboxLabel: {
        color: Colors.glass.text,
        fontSize: 16,
    },
    helperText: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
        marginBottom: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
    }
});
