import { Image, StyleSheet, Text, View } from 'react-native';
import { Cat } from '../types/cat';
import { colors } from '../theme/colors';
import { TVFocusableCard } from './TVFocusableCard';

type Props = {
  cat: Cat;
  onPress: () => void;
  preferred?: boolean;
};

const FALLBACK =
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80';

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

const statusColor = (status?: string | null) => {
  if (!status) return colors.textSecondary;
  const normalized = status.toLowerCase();
  if (normalized.includes('need')) return colors.danger;
  if (normalized.includes('adopt')) return colors.accent;
  return colors.success;
};

export const CatSummaryCard = ({ cat, onPress, preferred }: Props) => {
  return (
    <TVFocusableCard onPress={onPress} preferred={preferred}>
      <View style={styles.row}>
        <Image source={{ uri: cat.image || FALLBACK }} style={styles.image} resizeMode="cover" />
        <View style={styles.meta}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{cat.name}</Text>
            <View style={[styles.badge, { borderColor: statusColor(cat.status) }]}>
              <Text style={[styles.badgeText, { color: statusColor(cat.status) }]}>
                {cat.status ?? 'Unknown'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{cat.breed ?? 'Unknown breed'}</Text>
          <Text style={styles.copy} numberOfLines={2}>
            {cat.description ?? 'No description yet.'}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.metaText}>Fed {formatAgo(cat.lastFed)}</Text>
            <Text style={styles.metaText}>Seen {formatAgo(cat.lastSighted)}</Text>
            {cat.timesFed !== undefined && cat.timesFed !== null && (
              <Text style={styles.metaText}>{cat.timesFed} feeds</Text>
            )}
          </View>
        </View>
      </View>
    </TVFocusableCard>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 18,
    backgroundColor: '#1f2330',
  },
  meta: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
