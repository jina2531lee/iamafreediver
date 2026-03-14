import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { PresetsScreen } from './PresetsScreen';

export const SettingsScreen = () => {
  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <Text className="text-2xl font-semibold text-textPrimary mb-2">
        Settings
      </Text>
      <Text className="text-xs text-textSecondary mb-6">
        Customize your DeepLog experience.
      </Text>

      <Text className="text-sm text-textSecondary mb-2">
        CO₂ / O₂ training presets
      </Text>
      <View className="mb-6">
        <PresetsScreen />
      </View>
    </ScrollView>
  );
};


