import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
