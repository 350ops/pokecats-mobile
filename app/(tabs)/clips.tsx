import { ClipFeed } from '@/components/ClipFeed';
import { ClipHeaderMenu } from '@/components/ClipHeaderMenu';
import { NativeGlassIconButton } from '@/components/ui/NativeGlassIconButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClipsTab() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDark } = useTheme();

    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                {/* Back Button - Hidden on Tabs usually, but user might want uniformity? The designs usually show tabs without back button. 
                   But in app/clips/index.tsx I had a back button. 
                   For a TAB, we usually DON'T want a back button unless it's a stack.
                   The user requested "remove the upper header" for Record, but for Clips feed they just wanted the + button.
                   The screenshot shows NO back button on the Tab version (obviously).
                   So I should OMIT the back button here. 
                */}

                {/* Title Container */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: isDark ? Colors.glass.text : Colors.primary.dark }]}>Cat Clips</Text>
                    <Text style={[styles.subtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                        Short videos shared by the community
                    </Text>
                </View>

                {/* Add Button */}
                <NativeGlassIconButton
                    icon="plus"
                    size={44}
                    iconSize={22}
                    onPress={() => setMenuVisible(true)}
                    accessibilityLabel="Add Clip"
                    style={styles.addButton}
                />
            </View>

            <ClipFeed />

            <ClipHeaderMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onRecord={() => router.push('/clips/record?action=camera')}
                onUpload={() => router.push('/clips/record?action=upload')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

