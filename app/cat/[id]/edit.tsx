import { GlassButton } from '@/components/ui/GlassButton';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { getCat, updateCat, uploadCatImage } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export default function EditCatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [tnrStatus, setTnrStatus] = useState(false);
    const [colors, setColors] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [newImageUri, setNewImageUri] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        const cat = await getCat(Number(id));
        if (cat) {
            setDescription(cat.description || '');
            setTnrStatus(cat.tnrStatus || false);
            setColors((cat.colorProfile || []).join(', '));
            setImage(cat.image);
        }
        setLoading(false);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalImageUrl = image;

            if (newImageUri) {
                const uploadedUrl = await uploadCatImage(newImageUri);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                }
            }

            await updateCat(Number(id), {
                description,
                tnrStatus,
                colorProfile: colors.split(',').map(c => c.trim()).filter(Boolean),
                image: finalImageUrl || undefined
            });

            router.back();
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary.green} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <Stack.Screen options={{ title: 'Edit Cat', headerTintColor: Colors.primary.green }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageSection}>
                    <Image source={{ uri: newImageUri || image || 'https://via.placeholder.com/300' }} style={styles.previewImage} />
                    <GlassButton title="Change Photo" icon="camera.fill" onPress={pickImage} style={styles.changePhotoBtn} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.icon }]}>About this cat</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: theme.text, borderColor: isDark ? Colors.glass.border : '#ddd', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9' }]}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the cat..."
                        placeholderTextColor={isDark ? '#555' : '#aaa'}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.icon }]}>Colors (comma separated)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: isDark ? Colors.glass.border : '#ddd', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9' }]}
                        value={colors}
                        onChangeText={setColors}
                        placeholder="e.g. Orange, White"
                        placeholderTextColor={isDark ? '#555' : '#aaa'}
                    />
                </View>

                <View style={[styles.formGroup, styles.row, { justifyContent: 'space-between' }]}>
                    <Text style={[styles.label, { color: theme.icon }]}>TNR Status (Sterilized)</Text>
                    <Switch
                        value={tnrStatus}
                        onValueChange={setTnrStatus}
                        trackColor={{ false: '#767577', true: Colors.primary.green }}
                        thumbColor={'#fff'}
                    />
                </View>

                <View style={styles.actions}>
                    <GlassButton
                        title={saving ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        variant="primary"
                        disabled={saving}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    imageSection: {
        alignItems: 'center',
        gap: 15,
        marginBottom: 10,
    },
    previewImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#eee',
    },
    changePhotoBtn: {
        width: 160,
        height: 40,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actions: {
        marginTop: 20,
    },
});
