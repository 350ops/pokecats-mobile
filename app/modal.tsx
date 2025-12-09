import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addCat } from '@/lib/database';

export default function ModalScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    addCat(name || 'Unknown', description, image || '', 25.3712, 51.5484);    // Use dummy coords for now or fetch real ones if Location was implemented
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>New Sighting</Text>

        <GlassView style={styles.form} intensity={30}>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cat Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Whiskers"
              placeholderTextColor={Colors.glass.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description & Location</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the cat and where you saw it..."
              placeholderTextColor={Colors.glass.textSecondary}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <GlassButton
            title="Submit Report"
            variant="primary"
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </GlassView>
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
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.glass.text,
    marginBottom: 20,
    marginTop: 20,
  },
  form: {
    padding: 20,
  },
  imagePicker: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.glass.textSecondary,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.glass.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    color: Colors.glass.text,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    width: '100%',
    marginTop: 10,
  }
});
