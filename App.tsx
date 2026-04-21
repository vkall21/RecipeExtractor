import React from 'react';
import { Pressable, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MeasurementProvider } from './src/context/MeasurementContext';
import HomeScreen from './src/screens/HomeScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <MeasurementProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={({ navigation, route }) => ({
              headerStyle: { backgroundColor: '#fff' },
              headerTitleStyle: { fontWeight: '700', fontSize: 17 },
              headerTintColor: '#e8553e',
              headerRight: route.name !== 'Settings' ? () => (
                <Pressable onPress={() => navigation.navigate('Settings')} style={{ marginRight: 4 }}>
                  <Text style={{ fontSize: 22 }}>⚙️</Text>
                </Pressable>
              ) : undefined,
            })}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Recipe Magic' }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe' }} />
            <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </MeasurementProvider>
  );
}
