import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { getCats } from '@/lib/database';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const INITIAL_REGION = {
    latitude: 25.3712,
    longitude: 51.5484,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

export default function MapScreen() {
    const [selectedCat, setSelectedCat] = useState<any>(null); // DB object has slightly different shape?
    const [cats, setCats] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            const fetchCats = async () => {
                const data = await getCats();
                setCats(data);
            };
            fetchCats();
        }, [])
    );

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Map not supported on web yet</Text>
            </View>
        )
    }

    const getFedStatusColor = (dateStr?: string | Date) => {
        if (!dateStr) return Colors.glass.textSecondary;
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
        if (hours < 4) return Colors.primary.green; // Recently fed
        if (hours > 12) return 'rgba(255, 99, 71, 1)'; // Red/Tomato - hungry
        return Colors.primary.yellow; // Warning
    };

    const getTimeAgo = (dateStr?: string | Date) => {
        if (!dateStr) return 'Unknown';
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        return `${hours}h ago`;
    };

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={INITIAL_REGION}
                userInterfaceStyle="dark"
                tintColor={Colors.primary.green}
                onPress={() => setSelectedCat(null)}
            >
                {cats.map(cat => (
                    <Marker
                        key={cat.id}
                        coordinate={{ latitude: cat.latitude, longitude: cat.longitude }}
                        // We disable the default callout by not providing title/desc in the prop if we handle selection manually
                        // But providing them is useful for accessibility. 
                        // However, on iOS, tapping a marker usually centers it or shows callout.
                        // We want to hook into onPress.
                        onPress={(e) => {
                            e.stopPropagation();
                            setSelectedCat(cat);
                        }}
                    >
                        {/* Custom Marker View could go here, staying default for now but colored */}
                        <View style={[styles.markerDot, { backgroundColor: cat.status === 'Needs Help' ? '#FF6B6B' : Colors.primary.green }]} />
                    </Marker>
                ))}
            </MapView>

            {!selectedCat && (
                <GlassView style={styles.overlay} intensity={60}>
                    <Text style={styles.overlayText}>{cats.length} Cats Nearby</Text>
                </GlassView>
            )}

            {selectedCat && (
                <GlassView style={styles.detailOverlay} intensity={80}>
                    <View style={styles.detailHeader}>
                        <View>
                            <Text style={styles.catName}>{selectedCat.name}</Text>
                            <Text style={styles.catBreed}>{selectedCat.breed}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Link href={{ pathname: '/update', params: { id: selectedCat.id } }} asChild>
                                <GlassButton title="" icon="arrow.triangle.2.circlepath" style={{ height: 36, width: 36, paddingHorizontal: 0 }} />
                            </Link>
                            <Link href={`/cat/${selectedCat.id}`} asChild>
                                <GlassButton title="Profile" icon="chevron.right" style={{ height: 36, paddingHorizontal: 12 }} />
                            </Link>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        {/* Last Fed */}
                        <View style={styles.infoItem}>
                            <View style={styles.iconRow}>
                                <SymbolView name="fork.knife" tintColor={getFedStatusColor(selectedCat.lastFed)} size={20} />
                                <Text style={[styles.infoLabel, { color: getFedStatusColor(selectedCat.lastFed) }]}>
                                    Last Fed
                                </Text>
                            </View>
                            <Text style={styles.infoValue}>{getTimeAgo(selectedCat.lastFed)}</Text>
                        </View>

                        {/* Last Sighted */}
                        <View style={styles.infoItem}>
                            <View style={styles.iconRow}>
                                <SymbolView name="eye.fill" tintColor={Colors.glass.text} size={20} />
                                <Text style={styles.infoLabel}>Seen</Text>
                            </View>
                            <Text style={styles.infoValue}>{getTimeAgo(selectedCat.lastSighted)}</Text>
                        </View>

                        {/* TNR Status */}
                        <View style={styles.infoItem}>
                            <View style={styles.iconRow}>
                                {/* Ear tip icon or scissors or similar. 'scissors' is standard SF Symbol */}
                                <SymbolView
                                    name={selectedCat.tnrStatus ? "checkmark.shield.fill" : "exclamationmark.shield.fill"}
                                    tintColor={selectedCat.tnrStatus ? Colors.primary.green : Colors.primary.yellow}
                                    size={20}
                                />
                                <Text style={[styles.infoLabel, { color: selectedCat.tnrStatus ? Colors.primary.green : Colors.primary.yellow }]}>
                                    TNR
                                </Text>
                            </View>
                            <Text style={styles.infoValue}>{selectedCat.tnrStatus ? "Sterilized" : "Intact"}</Text>
                        </View>
                    </View>
                </GlassView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary.dark,
    },
    markerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    overlay: {
        position: 'absolute',
        top: 60,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    overlayText: {
        color: Colors.glass.text,
        fontWeight: 'bold',
    },
    detailOverlay: {
        position: 'absolute',
        bottom: 110, // Above tab bar
        left: 20,
        right: 20,
        padding: 20,
        borderRadius: 24,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    catName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    catBreed: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.glass.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.glass.text,
    }
});
