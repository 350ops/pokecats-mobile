import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { uploadCatClip } from '@/lib/clipUpload';
import { Camera, CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    onUploaded?: (clipId: string) => void;
};

const MAX_SECONDS = 20;

export function ClipRecorder({ onUploaded }: Props) {
    const cameraRef = useRef<Camera | null>(null);
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
    const [micPermission, requestMicPermission] = Camera.useMicrophonePermissions();
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);

    useEffect(() => {
        if (!cameraPermission) {
            requestCameraPermission();
        }
        if (!micPermission) {
            requestMicPermission();
        }
    }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

    const hasAllPermissions = cameraPermission?.granted && micPermission?.granted;

    const ensurePermissions = useCallback(async () => {
        if (hasAllPermissions) return true;
        const [cam, mic] = await Promise.all([requestCameraPermission(), requestMicPermission()]);
        return cam?.granted && mic?.granted;
    }, [hasAllPermissions, requestCameraPermission, requestMicPermission]);

    const stopRecording = useCallback(() => {
        if (recording) {
            cameraRef.current?.stopRecording();
        }
    }, [recording]);

    const startRecording = useCallback(async () => {
        if (recording || uploading) return;
        const permitted = await ensurePermissions();
        if (!permitted) {
            Alert.alert('Permissions needed', 'Camera and microphone are required to record.');
            return;
        }
        const cam = cameraRef.current;
        if (!cam) return;
        try {
            setRecording(true);
            setProgress(0);
            setStartedAt(Date.now());
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const result = await cam.recordAsync({
                maxDuration: MAX_SECONDS,
                quality: Camera.Constants.VideoQuality['720p'],
            });
            setRecording(false);
            if (!result?.uri) return;
            await handleUpload(result.uri);
        } catch (error: any) {
            console.error(error);
            setRecording(false);
            Alert.alert('Recording failed', error?.message ?? 'Please try again.');
        }
    }, [ensurePermissions, recording, uploading]);

    const handleUpload = useCallback(
        async (uri: string) => {
            try {
                setUploading(true);
                const elapsedSeconds = startedAt ? Math.min(MAX_SECONDS, Math.max(1, Math.round((Date.now() - startedAt) / 1000))) : undefined;
                const clipId = await uploadCatClip({
                    localVideoUri: uri,
                    onProgress: setProgress,
                    durationSeconds: elapsedSeconds,
                });
                setUploading(false);
                setProgress(0);
                setStartedAt(null);
                onUploaded?.(clipId);
                Alert.alert('Uploaded', 'Your clip is live in the feed.');
            } catch (error: any) {
                console.error(error);
                setUploading(false);
                Alert.alert('Upload failed', error?.message ?? 'Please try again.');
            }
        },
        [onUploaded, startedAt]
    );

    return (
        <View style={styles.container}>
            <Camera
                ref={(ref) => (cameraRef.current = ref)}
                style={StyleSheet.absoluteFill}
                type={CameraType.back}
                ratio="16:9"
            />

            {!hasAllPermissions && (
                <View style={[styles.permissionBanner, { top: insets.top + 16 }]}>
                    <Text style={styles.permissionText}>Camera + mic access required</Text>
                </View>
            )}

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                <Text style={styles.caption}>Hold to record (max {MAX_SECONDS}s)</Text>
                <Pressable
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    disabled={uploading || !hasAllPermissions}
                    style={[
                        styles.recordButton,
                        recording && styles.recordButtonActive,
                        uploading && styles.disabled,
                    ]}
                >
                    {uploading ? (
                        <View style={styles.progressWrap}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                        </View>
                    ) : (
                        <SymbolView name={recording ? 'stop.fill' : 'record.circle'} size={36} tintColor="#fff" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    permissionBanner: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    permissionText: {
        color: '#fff',
        fontWeight: '700',
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        gap: 12,
    },
    caption: {
        color: '#fff',
        fontWeight: '600',
    },
    recordButton: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButtonActive: {
        backgroundColor: '#ff4d67',
    },
    disabled: {
        opacity: 0.6,
    },
    progressWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    progressText: {
        color: '#fff',
        fontWeight: '700',
    },
});
