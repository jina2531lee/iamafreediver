import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/BottomTabs';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

