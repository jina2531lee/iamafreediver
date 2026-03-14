import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafetyCard } from '../components/SafetyCard';

export const HomeScreen = () => {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#020617',
        paddingHorizontal: 16,
        paddingTop: 48,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '600',
          color: '#e5e7eb',
          marginBottom: 16,
        }}
      >
        DeepLog
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#9ca3af',
          marginBottom: 24,
        }}
      >
        Freediving companion for logging, training, and safety insights.
      </Text>

      <SafetyCard />

      <View
        style={{
          marginTop: 32,
          borderWidth: 1,
          borderColor: 'rgba(34,211,238,0.4)',
          borderRadius: 24,
          padding: 16,
          backgroundColor: 'rgba(2,6,23,0.9)',
        }}
      >
        <Text style={{ fontSize: 16, color: '#9ca3af' }}>
          Quick overview cards will appear here (upcoming sessions, last PB,
          weekly volume).
        </Text>
      </View>
    </ScrollView>
  );
};
