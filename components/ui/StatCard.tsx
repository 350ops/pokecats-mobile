import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
    value: string | number;
    label: string;
    gradientColors: readonly [string, string, ...string[]];
}

export function StatCard({ value, label, gradientColors }: StatCardProps) {
    return (
        <LinearGradient
            colors={gradientColors}
            style={styles.card}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
        >
            <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 17,
        width: '100%',
        minHeight: 100, // Based on Figma text positioning (approx)
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'System',
        color: '#000000',
        marginBottom: 4, // Space between label and value
        textAlign: 'center',
    },
    value: {
        fontSize: 32,
        fontWeight: '300',
        fontFamily: 'System',
        color: '#000000',
        textAlign: 'center',
    },
});
