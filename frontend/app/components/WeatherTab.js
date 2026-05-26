// ============================
// frontend/app/components/WeatherTab.js
// Weather component with both manual city search
// and GPS-based auto-location. Uses OpenWeatherMap API
// and provides farming advice based on conditions.
// ----------------------------
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import styles from '../styles';

const WEATHER_API_KEY = "ccf4ebf3d056dd0c5b3c946f68177f4e";
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

const getFarmingAdvice = (weather) => {
  if (!weather) return [];

  let advice = [];

  // Temperature-based advice
  if (weather.temp > 35) {
    advice.push('🌡️ High temperature - Increase irrigation frequency');
    advice.push('⏰ Irrigate early morning (5-7 AM) or evening (6-8 PM)');
  } else if (weather.temp < 15) {
    advice.push('❄️ Cold weather - Protect young plants from frost');
    advice.push('🌱 Good time for winter crops like wheat, mustard');
  }

  // Humidity-based advice
  if (weather.humidity > 80) {
    advice.push('💧 High humidity - Watch for fungal diseases');
    advice.push('🍃 Ensure good air circulation in crops');
    advice.push('⚠️ Delay spraying pesticides if possible');
  } else if (weather.humidity < 40) {
    advice.push('🏜️ Low humidity - Increase irrigation');
    advice.push('💦 Use mulching to retain soil moisture');
  }

  // Weather condition advice
  if (weather.main === 'Rain' || weather.main === 'Drizzle') {
    advice.push('🌧️ Rain expected - Postpone pesticide spraying');
    advice.push('⛔ Avoid irrigation today');
    advice.push('📅 Good time for transplanting after rain');
  } else if (weather.main === 'Clear') {
    advice.push('☀️ Clear weather - Good for spraying operations');
    advice.push('✅ Suitable for harvesting activities');
  }

  // Wind-based advice
  if (weather.wind_speed > 5) {
    advice.push('💨 Windy conditions - Avoid pesticide/fertilizer spraying');
  }

  return advice;
};

export default function WeatherTab() {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchWeatherByCoords = async (lat, lon, cityName) => {
    setLoading(true);
    setWeatherData(null);

    try {
      const response = await axios.get(WEATHER_API_URL, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;

      const weather = {
        city: cityName || data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: data.weather[0].icon,
        wind_speed: data.wind.speed,
        clouds: data.clouds.all,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setWeatherData(weather);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not fetch weather data.'
      );
    } finally {
      setLoading(false);
    }
  };

  // GPS-based location detection
  const handleUseMyLocation = async () => {
    setGpsLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is needed to auto-detect your weather. Please enter city name manually.'
        );
        setGpsLoading(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const reverseGeo = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let cityName = '';
      if (reverseGeo && reverseGeo.length > 0) {
        cityName = reverseGeo[0].city || reverseGeo[0].subregion || reverseGeo[0].region || '';
        setLocation(cityName);
      }

      setGpsLoading(false);

      // Fetch weather with coordinates
      await fetchWeatherByCoords(latitude, longitude, cityName);
    } catch (error) {
      console.log('GPS Error:', error);
      Alert.alert('Error', 'Could not get your location. Please enter city name manually.');
      setGpsLoading(false);
    }
  };

  // Manual city search
  const handleWeather = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter your location');
      return;
    }

    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      Alert.alert(
        'API Key Required',
        'Please add your OpenWeatherMap API key. Get free key at openweathermap.org'
      );
      return;
    }

    setLoading(true);
    setWeatherData(null);

    try {
      // Step 1: Use Open-Meteo geocoding to find coordinates (works great for Indian villages)
      const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`);
      let lat, lon, resolvedName;

      if (geoRes.data && geoRes.data.results && geoRes.data.results.length > 0) {
        lat = geoRes.data.results[0].latitude;
        lon = geoRes.data.results[0].longitude;
        resolvedName = geoRes.data.results[0].name;
      }

      if (lat && lon) {
        await fetchWeatherByCoords(lat, lon, resolvedName);
      } else {
        // Fallback to OpenWeatherMap's default text search
        const response = await axios.get(WEATHER_API_URL, {
          params: {
            q: location,
            appid: WEATHER_API_KEY,
            units: 'metric',
          },
        });

        const data = response.data;

        const weather = {
          city: data.name,
          country: data.sys.country,
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          description: data.weather[0].description,
          main: data.weather[0].main,
          icon: data.weather[0].icon,
          wind_speed: data.wind.speed,
          clouds: data.clouds.all,
          sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setWeatherData(weather);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'City not found. Please check spelling.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Location Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>📍 Enter City Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Kolar, Hassan, Bangalore"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#999"
        />
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', marginBottom: 15, gap: 10 }}>
        {/* GPS Auto-detect Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#1976d2',
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          onPress={handleUseMyLocation}
          disabled={gpsLoading || loading}
        >
          {gpsLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              📍 Use My Location
            </Text>
          )}
        </TouchableOpacity>

        {/* Manual Search Button */}
        <TouchableOpacity
          style={[
            {
              flex: 1,
              backgroundColor: '#4a7c2c',
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            },
            (loading || gpsLoading) && { opacity: 0.6 },
          ]}
          onPress={handleWeather}
          disabled={loading || gpsLoading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              🔍 Search City
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {weatherData ? (
        <View>
          {/* Main Weather Card */}
          <View style={styles.weatherCard}>
            <Text style={styles.weatherCity}>
              {weatherData.city}, {weatherData.country}
            </Text>
            <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
            <Text style={styles.weatherDesc}>
              {weatherData.description.charAt(0).toUpperCase() +
                weatherData.description.slice(1)}
            </Text>
            <Text style={styles.weatherFeels}>
              Feels like {weatherData.feels_like}°C
            </Text>
          </View>

          {/* Weather Details */}
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailRow}>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>🌡️ Min/Max</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.temp_min}°C / {weatherData.temp_max}°C
                </Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>💧 Humidity</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.humidity}%
                </Text>
              </View>
            </View>

            <View style={styles.weatherDetailRow}>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>💨 Wind</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.wind_speed} m/s
                </Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>☁️ Clouds</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.clouds}%
                </Text>
              </View>
            </View>

            <View style={styles.weatherDetailRow}>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>🌅 Sunrise</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.sunrise}
                </Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailLabel}>🌇 Sunset</Text>
                <Text style={styles.weatherDetailValue}>
                  {weatherData.sunset}
                </Text>
              </View>
            </View>
          </View>

          {/* Farming Advice Based on Real Weather */}
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>🌾 Farming Advice:</Text>
            {getFarmingAdvice(weatherData).map((tip, index) => (
              <Text key={index} style={styles.adviceText}>
                {tip}
              </Text>
            ))}

            {/* Best time for irrigation */}
            <Text style={styles.adviceText}>
              ⏰ Best irrigation time: {' '}
              {weatherData.temp > 30 ? '6-7 AM or 7-8 PM' : '7-9 AM or 5-7 PM'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Weather Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🌤️ Weather Guidelines:</Text>
        <Text style={styles.tipsText}>
          • Check weather daily for farming operations{''}
          {'\n'}• Avoid spraying before rain{''}
          {'\n'}• Plan harvest based on 3-day forecast{''}
          {'\n'}• Monitor temperature for disease control{''}
          {'\n'}• High humidity = fungal disease risk
        </Text>
      </View>
    </View>
  );
}
