import { Colors } from '@/constants/Colors';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { GlassButton } from './ui/GlassButton';
import { GlassView } from './ui/GlassView';

type Coordinate = {
    latitude: number;
    longitude: number;
};

type LocationAdjustModalProps = {
    visible: boolean;
    coordinate?: Coordinate;
    onClose: () => void;
    onSave: (coordinate: Coordinate) => void;
};

const DEFAULT_REGION: Region = {
    latitude: 25.3712,
    longitude: 51.5484,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

const fallbackCoordinate = (): Coordinate => ({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
});

export function LocationAdjustModal({ visible, coordinate, onClose, onSave }: LocationAdjustModalProps) {
    const [draftCoordinate, setDraftCoordinate] = useState<Coordinate>(coordinate ?? fallbackCoordinate());

    const region = useMemo(() => {
        if (coordinate) {
            return {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }
        return DEFAULT_REGION;
    }, []); // Only define initial region from props, then let map handle it

    // Update draft coordinate when prop changes
    useEffect(() => {
        if (visible && coordinate) {
            setDraftCoordinate(coordinate);
        } else if (visible && !coordinate) {
            setDraftCoordinate(fallbackCoordinate());
        }
    }, [coordinate, visible]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <GlassView style={styles.sheet} intensity={70}>
                    <Text style={styles.title}>Adjust pin location</Text>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={region}
                            showsPointsOfInterest={false}
                            onRegionChangeComplete={(updated) => {
                                setDraftCoordinate({ latitude: updated.latitude, longitude: updated.longitude });
                            }}
                        />
                        <View style={styles.centerMarkerContainer} pointerEvents="none">
                            <SymbolView name="mappin.circle.fill" size={40} tintColor="#eb4d3d" />
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <GlassButton title="Cancel" variant="glass" onPress={onClose} style={{ flex: 1 }} />
                        <GlassButton
                            title="Save"
                            variant="primary"
                            onPress={() => {
                                if (draftCoordinate) {
                                    onSave(draftCoordinate);
                                }
                                onClose();
                            }}
                            style={{ flex: 1 }}
                        />
                    </View>
                </GlassView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    sheet: {
        borderRadius: 24,
        padding: 20,
        gap: 16,
    },
    title: {
        color: Colors.glass.text,
        fontSize: 18,
        fontWeight: '700',
    },
    mapContainer: {
        height: 300,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centerMarkerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20, // Offset to align pin point with center
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
});
