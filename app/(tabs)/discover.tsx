import { StyleSheet, View, FlatList, Platform, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CatCard } from '@/components/CatCard';
import { MOCK_CATS } from '@/constants/MockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header Blur Background - giving it a sticky header feel if needed, but for now just absolute */}

      <FlatList
        data={MOCK_CATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/cat/${item.id}`} asChild>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.dark,
  },
  listContent: {
    paddingHorizontal: 20,
  }
});
