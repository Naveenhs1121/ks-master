// ============================
// frontend/app/home.js
// Main application screen displayed after login.
// Contains tab navigation for Ask AI, Weather, Tips,
// and Market modules. Uses MaterialCommunityIcons
// for polished tab icons.
// ----------------------------
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import AskTab from './components/AskTab';
import WeatherTab from './components/WeatherTab';
import TipsTab from './components/TipsTab';
import MarketTab from './components/MarketTab';
import styles from './styles';

const TABS = [
  { key: 'ask', label: 'AI ಕೇಳಿ', icon: 'robot', iconSet: 'mci' },
  { key: 'weather', label: 'ಹವಾಮಾನ', icon: 'weather-partly-cloudy', iconSet: 'mci' },
  { key: 'tips', label: 'ಸಲಹೆಗಳು', icon: 'lightbulb-on', iconSet: 'mci' },
  { key: 'market', label: 'ಮಾರುಕಟ್ಟೆ', icon: 'store', iconSet: 'mci' },
];

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { farmerId, farmerName } = params;
  const [activeTab, setActiveTab] = useState('ask');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#2e7d32', paddingTop: 50, paddingBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="account-circle" size={36} color="rgba(255,255,255,0.9)" />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.welcomeText, { color: 'white' }]}>ಸ್ವಾಗತ, {farmerName}!</Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಹಾಯಕ</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: '#f5f8f5' }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && {
                  borderBottomColor: '#2e7d32',
                  backgroundColor: 'white',
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#2e7d32' : '#999'}
              />
              <Text
                style={[
                  styles.tabText,
                  { marginTop: 4 },
                  isActive && { color: '#2e7d32', fontWeight: 'bold' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content}>
        {activeTab === 'ask' && <AskTab farmerId={farmerId} />}
        {activeTab === 'weather' && <WeatherTab />}
        {activeTab === 'tips' && <TipsTab />}
        {activeTab === 'market' && <MarketTab />}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.historyButton, { flexDirection: 'row', justifyContent: 'center' }]}
            onPress={() =>
              router.push({
                pathname: '/history',
                params: { farmerId },
              })
            }
          >
            <MaterialCommunityIcons name="history" size={20} color="#4a7c2c" />
            <Text style={[styles.historyButtonText, { marginLeft: 8 }]}>ಪ್ರಶ್ನೆ ಇತಿಹಾಸ ನೋಡಿ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { flexDirection: 'row', justifyContent: 'center' }]}
            onPress={() => {
              Alert.alert('ಲಾಗ್‌ಔಟ್', 'ನೀವು ಲಾಗ್‌ಔಟ್ ಮಾಡಲು ಖಚಿತವಾಗಿದ್ದೀರಾ?', [
                { text: 'ರದ್ದುಮಾಡಿ', style: 'cancel' },
                { text: 'ಲಾಗ್‌ಔಟ್', onPress: () => router.replace('/login') },
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={[styles.logoutButtonText, { marginLeft: 8 }]}>ಲಾಗ್‌ಔಟ್</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}
