import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { TVButton } from '../components/TVButton';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen = () => {
  const navigation = useNavigation<Navigation>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apple TV Controls</Text>
      <Text style={styles.copy}>Use the Siri Remote arrows to move, click to select, and Menu to go back.</Text>
      <Text style={styles.copy}>Filtering and actions are fully focusable. Long press play/pause on the simulator to open dev menu.</Text>
      <Text style={styles.copy}>
        To connect Supabase, create a .env file in this folder with SUPABASE_URL and SUPABASE_ANON_KEY.
      </Text>
      <View style={styles.actions}>
        <TVButton label="Back" tone="neutral" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 42,
    paddingVertical: 24,
    gap: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
  },
});
