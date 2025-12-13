import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { DOHA_AREAS } from '@/constants/DohaAreas';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ROLES = [
  'Neighbor',
  'Feeder',
  'Spotter',
  'Foster',
  'Vet Partner',
  'Shelter Partner',
] as const;

type Role = typeof ROLES[number];

export default function EditProfileScreen() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState<string>('');
  const [role, setRole] = useState<Role | ''>('');

  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error || !data.session?.user) {
        Alert.alert('Not signed in', 'Please sign in again.');
        router.back();
        return;
      }

      const user = data.session.user;
      const initialEmail = user.email ?? '';
      const initialName = (user.user_metadata?.name as string | undefined) ?? initialEmail.split('@')[0] ?? '';
      const initialArea = (user.user_metadata?.area as string | undefined) ?? '';
      const initialRole = (user.user_metadata?.role as Role | undefined) ?? '';

      setCurrentEmail(initialEmail);
      setEmail(initialEmail);
      setName(initialName);
      setArea(initialArea);
      setRole(initialRole);
      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const canSave = useMemo(() => {
    if (loading || saving) return false;
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    return true;
  }, [email, loading, name, saving]);

  const handleSave = async () => {
    if (!canSave) return;

    const nextEmail = email.trim();
    const nextName = name.trim();
    const nextArea = area.trim();

    // NOTE: This is a regex literal, so backslashes should NOT be double-escaped.
    // `\s` correctly matches whitespace; `\\s` would match a literal "\s".
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const existingMetadata = userData.user?.user_metadata ?? {};

      const { error } = await supabase.auth.updateUser({
        email: nextEmail !== currentEmail ? nextEmail : undefined,
        data: {
          ...existingMetadata,
          name: nextName,
          area: nextArea || null,
          role: role || null,
        },
      });

      if (error) {
        Alert.alert('Update failed', error.message);
        return;
      }

      if (nextEmail !== currentEmail) {
        Alert.alert('Email update requested', 'Check your inbox to confirm your new email address.');
      } else {
        Alert.alert('Saved', 'Your profile has been updated.');
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Update failed', e?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
          Update your details
        </Text>

        <GlassView style={styles.card} intensity={isDark ? 30 : 0}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
              style={[
                styles.input,
                {
                  color: isDark ? Colors.glass.text : Colors.light.text,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              autoCapitalize="words"
              editable={!loading && !saving}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
              style={[
                styles.input,
                {
                  color: isDark ? Colors.glass.text : Colors.light.text,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading && !saving}
              returnKeyType={Platform.OS === 'ios' ? 'done' : 'done'}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Area</Text>
            <Pressable
              onPress={() => setAreaPickerOpen(true)}
              disabled={loading || saving}
              style={({ pressed }) => [
                styles.select,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>
                {area ? area : 'Select an area'}
              </Text>
              <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>›</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>Role</Text>
            <Pressable
              onPress={() => setRolePickerOpen(true)}
              disabled={loading || saving}
              style={({ pressed }) => [
                styles.select,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>
                {role ? role : 'Select a role'}
              </Text>
              <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>›</Text>
            </Pressable>
          </View>
        </GlassView>

        <View style={styles.actions}>
          <GlassButton
            title={saving ? 'Saving…' : 'Save'}
            variant="secondary"
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.button, !canSave && { opacity: 0.6 }]}
          />
          <GlassButton title="Cancel" variant="glass" onPress={() => router.back()} style={styles.button} />
        </View>
      </ScrollView>

      <Modal
        visible={areaPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAreaPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAreaPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <GlassView style={styles.modalCard} intensity={isDark ? 40 : 0}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Choose area</Text>
              <Pressable onPress={() => setAreaPickerOpen(false)} style={styles.modalClose}>
                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>Done</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.areaList} keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={() => {
                  setArea('');
                  setAreaPickerOpen(false);
                }}
                style={({ pressed }) => [
                  styles.areaRow,
                  { borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>None</Text>
                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>{area ? '' : '✓'}</Text>
              </Pressable>

              {DOHA_AREAS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setArea(value);
                    setAreaPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.areaRow,
                    { borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>{value}</Text>
                  <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>
                    {area === value ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </GlassView>
        </View>
      </Modal>

      <Modal
        visible={rolePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRolePickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRolePickerOpen(false)} />
        <View style={styles.modalSheet}>
          <GlassView style={styles.modalCard} intensity={isDark ? 40 : 0}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>Choose role</Text>
              <Pressable onPress={() => setRolePickerOpen(false)} style={styles.modalClose}>
                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>Done</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.areaList} keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={() => {
                  setRole('');
                  setRolePickerOpen(false);
                }}
                style={({ pressed }) => [
                  styles.areaRow,
                  { borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>None</Text>
                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>{role ? '' : '✓'}</Text>
              </Pressable>

              {ROLES.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setRole(value);
                    setRolePickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.areaRow,
                    { borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>{value}</Text>
                  <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>
                    {role === value ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </GlassView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  select: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
  },
  modalCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  areaList: {
    paddingBottom: 12,
  },
  areaRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
