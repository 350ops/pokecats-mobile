import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TVEventHandler, useTVEventHandler, View } from 'react-native';
import { TVButton } from '../components/TVButton';
import { fetchCatById, recordFeeding, updateCatStatus } from '../data/catsApi';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { Cat } from '../types/cat';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CatDetail'>;

export const CatDetailScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCatById(params.catId);
    setCat(data);
    setLoading(false);
  }, [params.catId]);

  useEffect(() => {
    load();
  }, [load]);

  useTVEventHandler(
    useCallback(
      (evt: TVEventHandler['event']) => {
        if (evt.eventType === 'menu') navigation.goBack();
      },
      [navigation],
    ),
  );

  const handleFeed = async () => {
    if (!cat) return;
    setSaving(true);
    await recordFeeding(cat.id);
    setSaving(false);
    load();
  };

  const handleToggleStatus = async () => {
    if (!cat) return;
    const needsHelp = (cat.status ?? '').toLowerCase().includes('needs help');
    setSaving(true);
    await updateCatStatus(cat.id, needsHelp ? 'Healthy' : 'Needs Help');
    setSaving(false);
    load();
  };

  if (loading || !cat) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.meta}>Loading cat…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.hero}>
        <Image
          source={{
            uri:
              cat.image ??
              'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroMeta}>
          <Text style={styles.title}>{cat.name}</Text>
          <Text style={styles.subtitle}>{cat.breed ?? 'Unknown breed'}</Text>
          <Text style={styles.copy}>{cat.description ?? 'No description provided.'}</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, styles.badgeStatus]}>{cat.status ?? 'Unknown'}</Text>
            {cat.tnrStatus ? (
              <Text style={[styles.badge, styles.badgeOk]}>TNR</Text>
            ) : (
              <Text style={[styles.badge, styles.badgeWarn]}>Needs TNR</Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Last fed: {formatAgo(cat.lastFed)}</Text>
            <Text style={styles.meta}>Seen: {formatAgo(cat.lastSighted)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TVButton label={saving ? 'Saving…' : 'Mark Fed'} tone="success" onPress={handleFeed} disabled={saving} />
        <TVButton
          label={(cat.status ?? '').toLowerCase().includes('needs help') ? 'Mark Healthy' : 'Mark Needs Help'}
          tone="danger"
          onPress={handleToggleStatus}
          disabled={saving}
        />
        <TVButton label="Back" tone="neutral" onPress={() => navigation.goBack()} />
      </View>

      {cat.locationDescription && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Location</Text>
          <Text style={styles.copy}>{cat.locationDescription}</Text>
        </View>
      )}

      {cat.rescueFlags?.length ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Rescue Flags</Text>
          <View style={styles.badgeRow}>
            {cat.rescueFlags.map((flag) => (
              <Text key={flag} style={[styles.badge, styles.badgeWarn]}>
                {flag}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const formatAgo = (value?: string | Date | null) => {
  if (!value) return 'Unknown';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown';
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 42,
    paddingVertical: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hero: {
    flexDirection: 'row',
    gap: 24,
  },
  heroImage: {
    width: 520,
    height: 360,
    borderRadius: 24,
    backgroundColor: '#20242f',
  },
  heroMeta: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  badgeStatus: {
    borderColor: colors.accent,
  },
  badgeOk: {
    borderColor: colors.success,
  },
  badgeWarn: {
    borderColor: colors.warning,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 14,
  },
  panel: {
    marginTop: 24,
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
});
