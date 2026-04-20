import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerTintColor: '#e8553e',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Recipe Extractor' }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe' }} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
