import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { addTranslation, getCat, getTranslationHistory } from '@/lib/database';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Backend URL - assuming localhost for simulator (10.0.2.2 for Android, localhost for iOS simulator)
// For physical device, this needs to be the computer's IP.
const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/cat-translator' : 'http://localhost:3000/cat-translator';

export default function TranslateScreen() {
    const { id } = useLocalSearchParams();
    const [cat, setCat] = useState<any>(null);
    const [recording, setRecording] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [translation, setTranslation] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                const catData = await getCat(Number(id));
                setCat(catData);
                await loadHistory(Number(id));
            };
            fetchData();
        }
    }, [id]);

    const loadHistory = async (catId: number) => {
        const hist = await getTranslationHistory(catId);
        setHistory(hist);
    };

    const handlePressIn = () => {
        setRecording(true);
    };

    const handlePressOut = async () => {
        setRecording(false);
        setAnalyzing(true);

        // Mock Audio Analysis
        setTimeout(async () => {
            await processTranslation();
        }, 1500);
    };

    const processTranslation = async () => {
        try {
            // 1. Prepare Data
            const sentiments = ["Happy", "Urgent", "Curious", "Hungry", "Affectionate"];
            const mockSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

            if (!cat) return;

            const payload = {
                cat_profile: {
                    name: cat.name,
                    breed: cat.breed,
                    description: cat.description,
                    status: cat.status
                },
                audio_sentiment: mockSentiment,
                context: "User just recorded a meow in the app.",
                history: history.slice(0, 3).map(h => ({ translation: h.translation, sentiment: h.sentiment }))
            };

            // 2. Call Backend
            console.log("Sending to:", BACKEND_URL);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Backend failed');
            }

            const data = await response.json();

            // 3. Save & Display
            setTranslation(data);
            await addTranslation(cat.id, data.translation, data.emoji || mockSentiment);
            await loadHistory(cat.id);

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not translate. Ensure backend is running.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!cat) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Text style={styles.header}>Translate {cat.name}</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Result Area */}
                <View style={styles.resultContainer}>
                    {analyzing ? (
                        <View style={styles.analyzing}>
                            <ActivityIndicator size="large" color={Colors.primary.green} />
                            <Text style={styles.analyzingText}>Analyzing Meow...</Text>
                        </View>
                    ) : translation ? (
                        <GlassView style={styles.translationCard} intensity={50}>
                            <Text style={styles.emoji}>{translation.emoji || "😺"}</Text>
                            <Text style={styles.translationText}>“{translation.translation}”</Text>
                            <Text style={styles.styleLabel}>{translation.style || "Direct Translation"}</Text>
                        </GlassView>
                    ) : (
                        <View style={styles.placeholder}>
                            <SymbolView name="waveform" size={60} tintColor={Colors.glass.textSecondary} />
                            <Text style={styles.placeholderText}>Press and hold to record a meow</Text>
                        </View>
                    )}
                </View>

                {/* Record Button */}
                <View style={styles.recordContainer}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={[styles.recordButton, recording && styles.recordingBtn]}
                    >
                        <SymbolView
                            name="mic.fill"
                            size={40}
                            tintColor={recording ? "white" : Colors.primary.dark}
                        />
                    </TouchableOpacity>
                    <Text style={styles.hintText}>{recording ? "Listening..." : "Hold to Record"}</Text>
                </View>

                {/* History */}
                {history.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.historyTitle}>Running History</Text>
                        {history.map((h, i) => (
                            <GlassView key={i} style={styles.historyItem} intensity={20}>
                                <Text style={styles.historyEmoji}>{h.sentiment && h.sentiment.length < 5 ? h.sentiment : "🐱"}</Text>
                                <Text style={styles.historyText}>{h.translation}</Text>
                            </GlassView>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
        paddingTop: 60,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.glass.text,
        textAlign: 'center',
        marginBottom: 30,
    },
    resultContainer: {
        height: 250,
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    analyzing: {
        alignItems: 'center',
        gap: 10,
    },
    analyzingText: {
        color: Colors.primary.green,
        fontSize: 18,
        fontWeight: '600',
    },
    translationCard: {
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        gap: 15,
        backgroundColor: 'rgba(57, 255, 20, 0.1)', // Subtle green tint
        borderColor: Colors.primary.green,
        borderWidth: 1,
    },
    emoji: {
        fontSize: 50,
    },
    translationText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    styleLabel: {
        fontSize: 14,
        color: Colors.glass.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
        gap: 20,
    },
    placeholderText: {
        color: Colors.glass.textSecondary,
        fontSize: 16,
    },
    recordContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary.yellow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    recordingBtn: {
        backgroundColor: '#FF453A', // Red
        transform: [{ scale: 1.1 }],
    },
    hintText: {
        color: Colors.glass.text,
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
        paddingHorizontal: 20,
    },
    historyTitle: {
        color: Colors.glass.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    historyItem: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        gap: 10,
    },
    historyEmoji: {
        fontSize: 20,
    },
    historyText: {
        color: Colors.glass.text,
        fontSize: 16,
        flex: 1,
    }
});
