import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TVEventHandler, useTVEventHandler, View } from 'react-native';
import { CatSummaryCard } from '../components/CatSummaryCard';
import { TVButton } from '../components/TVButton';
import { useCats } from '../hooks/useCats';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { Cat } from '../types/cat';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { cats, loading, error, filter, setFilter, refresh } = useCats();
  const listRef = useRef<FlatList<Cat>>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const moveFocus = useCallback(
    (delta: number) => {
      if (!cats.length) return;
      const next = Math.max(0, Math.min(cats.length - 1, focusedIndex + delta));
      setFocusedIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    },
    [cats.length, focusedIndex],
  );

  const openDetail = useCallback(
    (cat: Cat) => {
      navigation.navigate('CatDetail', { catId: cat.id });
    },
    [navigation],
  );

  useTVEventHandler(
    useCallback(
      (evt: TVEventHandler['event']) => {
        if (evt.eventType === 'down' || evt.eventType === 'right') moveFocus(1);
        if (evt.eventType === 'up' || evt.eventType === 'left') moveFocus(-1);
        if (evt.eventType === 'select') {
          const cat = cats[focusedIndex];
          if (cat) openDetail(cat);
        }
        if (evt.eventType === 'menu') {
          navigation.navigate('Settings');
        }
      },
      [cats, focusedIndex, moveFocus, navigation, openDetail],
    ),
  );

  const renderItem = ({ item, index }: { item: Cat; index: number }) => (
    <View style={styles.cardWrapper}>
      <CatSummaryCard cat={item} onPress={() => openDetail(item)} preferred={index === 0} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nearby Colony Cats</Text>
          <Text style={styles.subtitle}>Browse reports and act with the remote.</Text>
        </View>
        <View style={styles.headerButtons}>
          <TVButton label="Refresh" onPress={refresh} tone="primary" />
          <TVButton label="Settings" onPress={() => navigation.navigate('Settings')} tone="neutral" />
        </View>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Filter</Text>
        <View style={styles.filterRow}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'needs-help', label: 'Needs Help' },
              { id: 'healthy', label: 'Healthy' },
              { id: 'adopted', label: 'Adopted' },
            ] as const
          ).map((option) => (
            <View key={option.id} style={styles.filterButton}>
              <TVButton
                label={option.label}
                tone={filter === option.id ? 'primary' : 'neutral'}
                onPress={() => setFilter(option.id)}
              />
            </View>
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.meta}>Loading cats…</Text>
        </View>
      )}

      {error && <Text style={[styles.meta, styles.errorText]}>{error}</Text>}

      {!loading && !cats.length && <Text style={styles.meta}>No cats found right now.</Text>}

      <FlatList
        ref={listRef}
        data={cats}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: 260,
          offset: 260 * index,
          index,
        })}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.index;
          if (typeof first === 'number') setFocusedIndex(first);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 42,
    paddingVertical: 24,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: 6,
  },
  filters: {
    marginTop: 6,
    gap: 8,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterButton: {
    width: 150,
  },
  listContent: {
    paddingVertical: 10,
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
  },
});
