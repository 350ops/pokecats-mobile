import { useTheme } from '@/context/ThemeContext';
import { uploadCatClip } from '@/lib/clipUpload';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    onUploaded?: (clipId: string) => void;
    onCancel?: () => void;
};

const MAX_SECONDS = 20;

export function ClipRecorder({ onUploaded, onCancel }: Props) {
    const cameraRef = useRef<CameraView | null>(null);
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [seconds, setSeconds] = useState(0);

    // Animation values
    const innerSize = useSharedValue(60);
    const innerRadius = useSharedValue(30);

    useEffect(() => {
        if (!cameraPermission) requestCameraPermission();
        if (!micPermission) requestMicPermission();
    }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

    useEffect(() => {
        let interval: any;
        if (recording) {
            // Animate to square
            innerSize.value = withSpring(30);
            innerRadius.value = withSpring(4);

            const start = Date.now();
            interval = setInterval(() => {
                const diff = (Date.now() - start) / 1000;
                setSeconds(diff);
                if (diff >= MAX_SECONDS) {
                    stopRecording();
                }
            }, 100);
        } else {
            // Animate to circle
            innerSize.value = withSpring(60);
            innerRadius.value = withSpring(30);
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [recording]);

    const hasAllPermissions = cameraPermission?.granted && micPermission?.granted;

    const stopRecording = useCallback(() => {
        if (recording) {
            cameraRef.current?.stopRecording();
            // State update will happen via logic in startRecording's await or effect
            // But actually stopRecording() is async on the native side.
            // The recordAsync promise resolves when recording stops.
            // We just trigger it here.
        }
    }, [recording]);

    const toggleRecording = useCallback(async () => {
        if (uploading) return;

        if (recording) {
            stopRecording();
            return;
        }

        // Start Recording
        if (!hasAllPermissions) {
            const [cam, mic] = await Promise.all([requestCameraPermission(), requestMicPermission()]);
            if (!cam?.granted || !mic?.granted) {
                Alert.alert('Permissions needed', 'Camera and microphone are required.');
                return;
            }
        }

        const cam = cameraRef.current;
        if (!cam) return;

        try {
            setRecording(true);
            setStartedAt(Date.now());
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const result = await cam.recordAsync({
                maxDuration: MAX_SECONDS,
            });

            // Recording stopped (either manually or limit reached)
            setRecording(false);
            if (result?.uri) {
                await handleUpload(result.uri);
            }
        } catch (error: any) {
            console.error(error);
            setRecording(false);
            // Ignore "stopped" errors if they happen during normal stop
        }
    }, [recording, uploading, hasAllPermissions, requestCameraPermission, requestMicPermission, stopRecording]);

    const handleUpload = async (uri: string) => {
        try {
            setUploading(true);
            const duration = startedAt ? (Date.now() - startedAt) / 1000 : undefined;

            const clipId = await uploadCatClip({
                localVideoUri: uri,
                onProgress: setProgress,
                durationSeconds: duration,
            });

            setUploading(false);
            onUploaded?.(clipId);
            Alert.alert('Uploaded', 'Your clip is live in the feed.');
        } catch (error: any) {
            console.error(error);
            setUploading(false);
            Alert.alert('Upload failed', error?.message ?? 'Please try again.');
        }
    };

    const rInnerStyle = useAnimatedStyle(() => ({
        width: innerSize.value,
        height: innerSize.value,
        borderRadius: innerRadius.value,
    }));

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                mode="video"
            />

            <View style={[styles.header, { top: insets.top + 10 }]}>
                {onCancel && !recording && !uploading && (
                    <Pressable onPress={onCancel} style={styles.cancelButton}>
                        <SymbolView name="xmark" size={24} tintColor="#fff" />
                    </Pressable>
                )}
                <View style={styles.timerPill}>
                    <Text style={styles.timerText}>
                        {formatTime(seconds)} / 00:20
                    </Text>
                </View>
            </View>

            {!hasAllPermissions && (
                <View style={[styles.permissionBanner, { top: insets.top + 60 }]}>
                    <Text style={styles.permissionText}>Camera + mic access required</Text>
                </View>
            )}

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 30 }]}>
                <Pressable
                    onPress={toggleRecording}
                    disabled={uploading}
                    style={[styles.recordButtonOuter, uploading && styles.disabled]}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FF4D67" />
                    ) : (
                        <Animated.View style={[styles.recordButtonInner, rInnerStyle]} />
                    )}
                </Pressable>
                {uploading && (
                    <Text style={styles.uploadText}>{Math.round(progress * 100)}% Uploading...</Text>
                )}
            </View>
        </View>
    );
}

function formatTime(sec: number) {
    const s = Math.min(Math.floor(sec), 20);
    return `00:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center', // Center the timer
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    cancelButton: {
        position: 'absolute',
        left: 20,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    timerPill: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    timerText: {
        color: '#fff',
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
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
        justifyContent: 'center',
        gap: 16,
    },
    recordButtonOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    recordButtonInner: {
        backgroundColor: '#FF4D67',
    },
    disabled: {
        opacity: 0.5,
    },
    uploadText: {
        color: '#fff',
        fontWeight: '600',
    },
});
