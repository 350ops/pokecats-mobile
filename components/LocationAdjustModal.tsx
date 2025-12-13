import { Colors } from '@/constants/Colors';
import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
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
        if (draftCoordinate) {
            return {
                latitude: draftCoordinate.latitude,
                longitude: draftCoordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }
        return DEFAULT_REGION;
    }, [draftCoordinate]);

    useEffect(() => {
        if (visible) {
            setDraftCoordinate(coordinate ?? fallbackCoordinate());
        }
    }, [coordinate, visible]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <GlassView style={styles.sheet} intensity={70}>
                    <Text style={styles.title}>Adjust pin location</Text>
                    <MapView
                        style={styles.map}
                        initialRegion={region}
                        region={region}
                        showsPointsOfInterest={false}
                        onRegionChangeComplete={(updated) => {
                            setDraftCoordinate({ latitude: updated.latitude, longitude: updated.longitude });
                        }}
                    >
                        {draftCoordinate && (
                            <Marker
                                coordinate={draftCoordinate}
                                draggable
                                onDragEnd={(event) => setDraftCoordinate(event.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>
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
    map: {
        height: 300,
        borderRadius: 20,
        overflow: 'hidden',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
});

