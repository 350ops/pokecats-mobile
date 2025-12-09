import { CatCard } from '@/components/CatCard';
import { Colors } from '@/constants/Colors';
import { MOCK_CATS } from '@/constants/MockData';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
      {/* Header Blur Background - giving it a sticky header feel if needed, but for now just absolute */}

      <FlatList
        data={MOCK_CATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/cat/${item.id}` as any} asChild>
            <Pressable>
              <CatCard cat={item} />
            </Pressable>
          </Link>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 20, paddingBottom: 100 }
        ]}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 15, // Gap between rows
  },
  columnWrapper: {
    gap: 15, // Gap between columns
  }
});
