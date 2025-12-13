import { ClipRecorder } from '@/components/ClipRecorder';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function RecordClipScreen() {
    const router = useRouter();
    const { isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <ClipRecorder
                onUploaded={() => {
                    router.replace('/clips');
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
