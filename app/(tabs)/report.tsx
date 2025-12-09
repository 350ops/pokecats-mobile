import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ReportScreen() {
    const { isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <Text style={[styles.title, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Report Sighting</Text>
            <GlassButton
                title="Open Full Form"
                icon="plus.circle.fill"
                variant="primary"
                onPress={() => router.push('/modal')}
            />
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
    title: {
        color: Colors.glass.text,
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 'bold',
    }
});
