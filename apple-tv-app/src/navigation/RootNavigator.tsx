import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { CatDetailScreen } from '../screens/CatDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0b0c10',
    card: '#0b0c10',
  },
};

export const RootNavigator = () => {
  return (
    <NavigationContainer theme={Platform.isTV ? navTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CatDetail" component={CatDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
