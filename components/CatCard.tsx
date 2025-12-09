import { StyleSheet, Text, View, Image } from 'react-native';
import { GlassView } from './ui/GlassView';
import { Colors } from '@/constants/Colors';
import { Cat } from '@/constants/MockData';

interface CatCardProps {
    cat: Cat;
}

export function CatCard({ cat }: CatCardProps) {
    return (
        <GlassView style={styles.card} intensity={40}>
            <Image source={{ uri: cat.image }} style={styles.image} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name}>{cat.name}</Text>
                    <View style={[styles.badge, cat.status === 'Needs Help' ? styles.badgeAlert : styles.badgeOk]}>
                        <Text style={styles.badgeText}>{cat.status}</Text>
                    </View>
                </View>
                <Text style={styles.breed}>{cat.breed}</Text>
                <View style={styles.footer}>
                    <Text style={styles.distance}>{cat.distance}</Text>
                </View>
            </View>
        </GlassView>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 24,
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: '#333',
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    breed: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    distance: {
        fontSize: 12,
        color: Colors.primary.green,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeOk: {
        backgroundColor: 'rgba(103, 206, 103, 0.2)', // Green tint
    },
    badgeAlert: {
        backgroundColor: 'rgba(240, 50, 50, 0.2)', // Red tint (using green or custom for alert)
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.glass.text,
    }
});
