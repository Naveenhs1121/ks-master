// ============================
// frontend/app/components/TipsTab.js
// AI-powered farming tips component. Fetches seasonal
// tips from the backend /tips endpoint (Gemini AI).
// Falls back to static tips if the API fails.
// ----------------------------
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import styles from '../styles';

const SECTION_ICONS = {
  seasonal_tips: '🌱',
  soil_health: '🌍',
  water_management: '💧',
  government_schemes: '🏛️',
  emergency_contacts: '📞',
};

const SECTION_ORDER = [
  'seasonal_tips',
  'soil_health',
  'water_management',
  'government_schemes',
  'emergency_contacts',
];

export default function TipsTab() {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTips = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get(`${BACKEND_URL}/tips`, {
        params: { language: 'Kannada' },
        timeout: 30000,
      });

      if (response.data.success && response.data.tips) {
        setTips(response.data.tips);
      } else {
        setError(true);
      }
    } catch (err) {
      console.log('Tips fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <ActivityIndicator size="large" color="#4a7c2c" />
        <Text style={{ marginTop: 15, fontSize: 16, color: '#666', textAlign: 'center' }}>
          🤖 AI is generating farming tips...
        </Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: '#999', textAlign: 'center' }}>
          ಕೃಷಿ ಸಲಹೆಗಳನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...
        </Text>
      </View>
    );
  }

  if (error || !tips) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 40, marginBottom: 15 }}>⚠️</Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 15 }}>
          Could not load AI tips. Please try again.
        </Text>
        <TouchableOpacity
          onPress={fetchTips}
          style={{
            backgroundColor: '#4a7c2c',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
            🔄 Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle raw text fallback
  if (tips.raw) {
    return (
      <ScrollView style={styles.tipsContainer}>
        <View style={styles.tipCard}>
          <Text style={styles.tipCardTitle}>🌾 AI Farming Tips</Text>
          <Text style={styles.tipCardText}>{tips.raw}</Text>
        </View>
        <TouchableOpacity
          onPress={fetchTips}
          style={{
            backgroundColor: '#e8f5e9',
            padding: 12,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#4a7c2c',
          }}
        >
          <Text style={{ color: '#4a7c2c', fontWeight: 'bold' }}>🔄 Refresh Tips</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.tipsContainer}>
      {/* AI badge */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8f5e9',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 15,
      }}>
        <Text style={{ fontSize: 13, color: '#2e7d32', fontWeight: '600' }}>
          🤖 AI-Generated Tips • Powered by Gemini
        </Text>
      </View>

      {SECTION_ORDER.map((key) => {
        const section = tips[key];
        if (!section || !section.tips) return null;

        const icon = SECTION_ICONS[key] || '📌';

        return (
          <View key={key} style={styles.tipCard}>
            <Text style={styles.tipCardTitle}>
              {icon} {section.title}
            </Text>
            <Text style={styles.tipCardText}>
              {section.tips.map((tip, idx) => (
                <Text key={idx}>
                  {'  '}{tip}
                  {idx < section.tips.length - 1 ? '\n' : ''}
                </Text>
              ))}
            </Text>
          </View>
        );
      })}

      {/* Refresh button */}
      <TouchableOpacity
        onPress={fetchTips}
        style={{
          backgroundColor: '#e8f5e9',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#4a7c2c',
        }}
      >
        <Text style={{ color: '#4a7c2c', fontWeight: 'bold', fontSize: 15 }}>
          🔄 Refresh Tips
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
