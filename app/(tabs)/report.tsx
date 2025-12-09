import { StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

export default function ReportScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Report Sighting</Text>
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
