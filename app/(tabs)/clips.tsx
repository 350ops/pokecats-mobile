import { ClipFeed } from '@/components/ClipFeed';
import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClipsTab() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={[styles.title, { color: isDark ? Colors.glass.text : Colors.primary.dark }]}>Cat Clips</Text>
                <Text style={[styles.subtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                    Short videos shared by the community
                </Text>
                <GlassButton
                    title="Record a clip"
                    icon="video.fill"
                    variant="secondary"
                    onPress={() => router.push('/clips/record')}
                    style={styles.cta}
                />
            </View>
            <ClipFeed />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        gap: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    cta: {
        marginTop: 10,
        alignSelf: 'flex-start',
    },
});

