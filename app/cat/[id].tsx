import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { getCat } from '@/lib/database';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CatDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [cat, setCat] = useState<any>(null); // DB record

    useFocusEffect(
        useCallback(() => {
            if (id) {
                getCat(Number(id)).then(setCat);
            }
        }, [id])
    );

    if (!cat) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Cat not found</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: cat.name,
                headerTransparent: true,
                headerTintColor: 'white',
                headerBlurEffect: 'dark'
            }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image source={{ uri: cat.image }} style={styles.image} />
                <View style={styles.contentContainer}>
                    <GlassView style={styles.detailsCard} intensity={20}>
                        <View style={styles.header}>
                            <Text style={styles.name}>{cat.name}</Text>
                            <Text style={styles.breed}>{cat.breed}</Text>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statLabel}>Status</Text>
                                <Text style={styles.statValue}>{cat.status}</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statLabel}>Distance</Text>
                                <Text style={styles.statValue}>{cat.distance}</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>{cat.description}</Text>

                        <View style={styles.actions}>
                            <Link href={`/cat/${id}/translate`} asChild>
                                <GlassButton title="Translate Meow" icon="mic.fill" variant="primary" style={styles.actionBtn} />
                            </Link>
                            <GlassButton title="I fed this cat" icon="heart.fill" variant="secondary" style={styles.actionBtn} />
                            <GlassButton title="Update Status" icon="pencil" style={styles.actionBtn} />
                        </View>
                    </GlassView>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    image: {
        width: '100%',
        height: 400,
        backgroundColor: '#333',
    },
    contentContainer: {
        marginTop: -50,
        paddingHorizontal: 20,
    },
    detailsCard: {
        padding: 24,
        borderRadius: 32,
    },
    header: {
        marginBottom: 20,
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.glass.text,
    },
    breed: {
        fontSize: 18,
        color: Colors.glass.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    stat: {
        marginRight: 40,
    },
    statLabel: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary.green,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.glass.text,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: Colors.glass.textSecondary,
        lineHeight: 24,
        marginBottom: 30,
    },
    actions: {
        gap: 12,
    },
    actionBtn: {
        width: '100%',
    }
});
