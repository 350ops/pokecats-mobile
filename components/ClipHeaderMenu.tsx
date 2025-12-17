import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    visible: boolean;
    onClose: () => void;
    onRecord: () => void;
    onUpload: () => void;
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function ClipHeaderMenu({ visible, onClose, onRecord, onUpload }: Props) {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Backdrop can be invisible or slightly dimmed if desired */}
                {/* <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)' }]} /> */}
            </Pressable>

            <Animated.View
                entering={ZoomIn.duration(200)}
                exiting={ZoomOut.duration(150)}
                style={[styles.menuContainer, { top: insets.top + 50 }]} // Position below the + button approx
            >
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurContainer}
                >
                    <MenuItem
                        label="Record Video"
                        icon="camera"
                        onPress={() => { onClose(); onRecord(); }}
                        isDark={isDark}
                        isFirst
                    />
                    <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                    <MenuItem
                        label="Upload Video"
                        icon="arrow.up.doc"
                        onPress={() => { onClose(); onUpload(); }}
                        isDark={isDark}
                        isLast
                    />
                </BlurView>
            </Animated.View>
        </Modal>
    );
}

function MenuItem({ label, icon, onPress, isDark, isFirst, isLast }: any) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={onPress}
        >
            <Text style={[styles.menuText, { color: isDark ? '#fff' : '#000' }]}>{label}</Text>
            <SymbolView name={icon} size={18} tintColor={isDark ? '#fff' : '#000'} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    menuContainer: {
        position: 'absolute',
        right: 16,
        width: 200,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    blurContainer: {
        width: '100%',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingVertical: 14,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        marginLeft: 16,
    },
});
