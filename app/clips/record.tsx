import { ClipRecorder } from '@/components/ClipRecorder';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { uploadCatClip } from '@/lib/clipUpload';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function RecordClipScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { action } = useLocalSearchParams();

    // Default to camera unless explicitly uploading, or if we want to support 'upload' mode visibly.
    // Actually, if action is 'upload', we just show the loading state or blank screen while picker is open.
    // If picker cancels, we go back.
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 1,
            });

            if (result.canceled) {
                // Return to feed if cancelled
                router.back();
                return;
            }

            if (result.assets[0]) {
                setUploading(true);
                const asset = result.assets[0];

                await uploadCatClip({
                    localVideoUri: asset.uri,
                    onProgress: setProgress,
                    durationSeconds: asset.duration ? Math.round(asset.duration / 1000) : undefined,
                });

                setUploading(false);
                Alert.alert('Uploaded', 'Your clip is live!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/clips') } // Explicitly go to tabs/clips
                ]);
            }
        } catch (error: any) {
            console.error(error);
            setUploading(false);
            Alert.alert('Error', error.message || 'Failed to upload video.');
            router.back();
        }
    };

    // Auto-trigger upload if action is 'upload'
    useEffect(() => {
        if (action === 'upload') {
            handleUpload();
        }
    }, [action]);

    // If uploading (or waiting for picker in upload mode), show loading/blank
    if (action === 'upload' || uploading) {
        return (
            <View style={[styles.container, {
                backgroundColor: isDark ? Colors.primary.dark : Colors.light.background,
                justifyContent: 'center',
                alignItems: 'center'
            }]}>
                <ActivityIndicator size="large" color={Colors.primary.blue} />
                <Text style={{ marginTop: 20, color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>
                    {uploading ? `Uploading... ${Math.round(progress * 100)}%` : 'Opening Library...'}
                </Text>
            </View>
        );
    }

    // Default: Show Recorder (Camera)
    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : '#000' }]}>
            <ClipRecorder
                onUploaded={() => {
                    router.replace('/(tabs)/clips');
                }}
                onCancel={() => router.back()} // Go back to feed on cancel
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
