// ============================
// frontend/app/components/MarketTab.js
// Market price lookup with Karnataka state filter.
// Uses government data.gov.in API with state/district
// filtering. No fake simulated prices.
// ----------------------------
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import styles from '../styles';

const POPULAR_CROPS = [
  { name: 'Wheat', kannada: 'ಗೋಧಿ', icon: 'grain' },
  { name: 'Rice', kannada: 'ಅಕ್ಕಿ', icon: 'rice' },
  { name: 'Tomato', kannada: 'ಟೊಮೇಟೊ', icon: 'food-apple' },
  { name: 'Onion', kannada: 'ಈರುಳ್ಳಿ', icon: 'food-variant' },
  { name: 'Potato', kannada: 'ಆಲೂಗಡ್ಡೆ', icon: 'food' },
  { name: 'Ragi', kannada: 'ರಾಗಿ', icon: 'barley' },
  { name: 'Jowar', kannada: 'ಜೋಳ', icon: 'corn' },
  { name: 'Maize', kannada: 'ಮೆಕ್ಕೆಜೋಳ', icon: 'corn' },
];

export default function MarketTab() {
  const [cropName, setCropName] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMarketPrice = async (searchCrop) => {
    const crop = searchCrop || cropName.trim();
    if (!crop) {
      Alert.alert('Error', 'Please enter crop name');
      return;
    }

    if (searchCrop) setCropName(searchCrop);
    setLoading(true);
    setMarketData(null);

    try {
      // Fetch with Karnataka state filter
      const response = await axios.get(
        'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
        {
          params: {
            'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
            format: 'json',
            limit: 20,
            'filters[commodity]': crop,
            'filters[state]': 'Karnataka',
          },
        }
      );

      if (response.data && response.data.records && response.data.records.length > 0) {
        const records = response.data.records;
        let totalMin = 0;
        let totalMax = 0;
        let count = 0;

        records.forEach((record) => {
          if (record.min_price && record.max_price) {
            totalMin += parseFloat(record.min_price);
            totalMax += parseFloat(record.max_price);
            count++;
          }
        });

        if (count === 0) {
          setMarketData({
            type: 'no_data',
            crop,
            message: `No price records with valid data found for "${crop}" in Karnataka.`,
          });
          return;
        }

        const avgMin = Math.round(totalMin / count);
        const avgMax = Math.round(totalMax / count);
        const avgPrice = Math.round((avgMin + avgMax) / 2);

        setMarketData({
          type: 'success',
          crop,
          avgMin,
          avgMax,
          avgPrice,
          count,
          records: records.slice(0, 5),
        });
      } else {
        // Try without state filter as fallback
        const fallbackRes = await axios.get(
          'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
          {
            params: {
              'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
              format: 'json',
              limit: 10,
              'filters[commodity]': crop,
            },
          }
        );

        if (fallbackRes.data && fallbackRes.data.records && fallbackRes.data.records.length > 0) {
          const records = fallbackRes.data.records;
          let totalMin = 0;
          let totalMax = 0;
          let count = 0;

          records.forEach((record) => {
            if (record.min_price && record.max_price) {
              totalMin += parseFloat(record.min_price);
              totalMax += parseFloat(record.max_price);
              count++;
            }
          });

          if (count > 0) {
            const avgMin = Math.round(totalMin / count);
            const avgMax = Math.round(totalMax / count);
            const avgPrice = Math.round((avgMin + avgMax) / 2);

            setMarketData({
              type: 'success',
              crop,
              avgMin,
              avgMax,
              avgPrice,
              count,
              records: records.slice(0, 5),
              note: 'Showing prices from all India (Karnataka data not available)',
            });
          } else {
            setMarketData({ type: 'no_data', crop });
          }
        } else {
          setMarketData({ type: 'no_data', crop });
        }
      }
    } catch (error) {
      console.error('Market API Error:', error);
      setMarketData({
        type: 'error',
        crop,
        message: 'Could not fetch market prices. Please check your internet connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Search Input */}
      <View style={styles.inputSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="store" size={20} color="#222" />
          <Text style={[styles.sectionLabel, { marginBottom: 0, marginLeft: 8 }]}>Crop Name:</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g., Wheat, Rice, Tomato, Onion"
            value={cropName}
            onChangeText={setCropName}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => handleMarketPrice()}
            disabled={loading}
            style={{
              backgroundColor: '#4a7c2c',
              padding: 14,
              borderRadius: 8,
              marginLeft: 10,
            }}
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Popular Crops Grid */}
      <View style={styles.quickButtons}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#222" />
          <Text style={[styles.sectionLabel, { marginBottom: 0, marginLeft: 8 }]}>Popular Crops:</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {POPULAR_CROPS.map((crop) => (
            <TouchableOpacity
              key={crop.name}
              style={{
                backgroundColor: cropName === crop.name ? '#4a7c2c' : '#e8f5e9',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#4a7c2c',
              }}
              onPress={() => handleMarketPrice(crop.name)}
            >
              <MaterialCommunityIcons
                name={crop.icon}
                size={16}
                color={cropName === crop.name ? 'white' : '#2d5016'}
              />
              <Text
                style={{
                  color: cropName === crop.name ? 'white' : '#2d5016',
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 6,
                }}
              >
                {crop.kannada}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ alignItems: 'center', padding: 30 }}>
          <ActivityIndicator size="large" color="#4a7c2c" />
          <Text style={{ marginTop: 10, color: '#666' }}>Fetching Karnataka mandi prices...</Text>
        </View>
      )}

      {/* Results */}
      {marketData && marketData.type === 'success' && (
        <View>
          {/* Price Summary Card */}
          <View style={{
            backgroundColor: '#e8f5e9',
            padding: 20,
            borderRadius: 15,
            marginBottom: 15,
            borderWidth: 2,
            borderColor: '#4a7c2c',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="chart-line" size={22} color="#2d5016" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d5016', marginLeft: 8 }}>
                {marketData.crop} — Karnataka Prices
              </Text>
            </View>

            {marketData.note && (
              <View style={{ backgroundColor: '#fff3e0', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#e65100' }}>⚠️ {marketData.note}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666' }}>Min Price</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#c62828' }}>₹{marketData.avgMin}</Text>
                <Text style={{ fontSize: 11, color: '#999' }}>per quintal</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666' }}>Avg Price</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>₹{marketData.avgPrice}</Text>
                <Text style={{ fontSize: 11, color: '#999' }}>per quintal</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#666' }}>Max Price</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1565c0' }}>₹{marketData.avgMax}</Text>
                <Text style={{ fontSize: 11, color: '#999' }}>per quintal</Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 }}>
              Based on {marketData.count} recent market entries
            </Text>
          </View>

          {/* Individual Mandi Records */}
          <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#4a7c2c" />
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#222', marginLeft: 6 }}>
                Mandi-wise Prices:
              </Text>
            </View>
            {marketData.records.map((r, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? '#f5f8f5' : 'white',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: '#4a7c2c',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 14 }}>
                  {r.market || 'Unknown'} ({r.district || ''})
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <Text style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    Min: ₹{r.min_price}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    Max: ₹{r.max_price}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#999' }}>
                    {r.arrival_date || 'Recent'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No Data */}
      {marketData && marketData.type === 'no_data' && (
        <View style={{ backgroundColor: '#fff3e0', padding: 20, borderRadius: 10, marginBottom: 15, alignItems: 'center' }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#ff9800" />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#e65100', marginTop: 10, textAlign: 'center' }}>
            No data found for "{marketData.crop}"
          </Text>
          <Text style={{ fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            The government database may not have recent entries.{'\n'}
            Try a different crop name or check:{'\n'}
            • e-NAM Portal: enam.gov.in{'\n'}
            • AGMARKNET: agmarknet.gov.in
          </Text>
        </View>
      )}

      {/* Error */}
      {marketData && marketData.type === 'error' && (
        <View style={{ backgroundColor: '#ffebee', padding: 20, borderRadius: 10, marginBottom: 15, alignItems: 'center' }}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#c62828" />
          <Text style={{ fontSize: 14, color: '#c62828', marginTop: 10, textAlign: 'center' }}>
            {marketData.message}
          </Text>
        </View>
      )}

      {/* Market Resources */}
      <View style={styles.tipsCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="information" size={18} color="#e65100" />
          <Text style={[styles.tipsTitle, { marginBottom: 0, marginLeft: 6 }]}>Market Resources:</Text>
        </View>
        <Text style={styles.tipsText}>
          • e-NAM Portal: enam.gov.in{'\n'}
          • AGMARKNET: agmarknet.gov.in{'\n'}
          • Mandi prices updated daily{'\n'}
          • Check MSP on agricoop.gov.in{'\n'}
          • Compare multiple markets before selling
        </Text>
      </View>
    </View>
  );
}
