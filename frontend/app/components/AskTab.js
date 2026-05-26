// ============================
// frontend/app/components/AskTab.js
// AI question component with text-to-speech,
// web-compatible image upload, and improved icons.
// ----------------------------
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Use centrally exported backend URL (reads from Expo extras)
import { BACKEND_URL } from '../config';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

// Helper to safely render any value (string, number, object, array, etc.)
const SafeText = ({ value, textStyle }) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return <Text style={textStyle}>{String(value)}</Text>;
  }
  if (Array.isArray(value)) {
    return (
      <View>
        {value.map((item, idx) => (
          <Text key={idx} style={textStyle}>{typeof item === 'string' ? item : JSON.stringify(item)}</Text>
        ))}
      </View>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return <Text style={textStyle}>{JSON.stringify(value, null, 2)}</Text>;
  }
  return <Text style={textStyle}>{String(value)}</Text>;
};

export default function AskTab({ farmerId }) {
  const [language, setLanguage] = useState('English');
  const [question, setQuestion] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // session form state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [crop, setCrop] = useState('Wheat');
  const [soilType, setSoilType] = useState('Loamy');
  const [ph, setPh] = useState('6.5');
  const [nitrogen, setNitrogen] = useState('10');
  const [phosphorus, setPhosphorus] = useState('10');
  const [potassium, setPotassium] = useState('10');
  const [waterAvailability, setWaterAvailability] = useState('Moderate');
  const [budgetRange, setBudgetRange] = useState('Medium');
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [showSoilOptions, setShowSoilOptions] = useState(false);
  const [showWaterOptions, setShowWaterOptions] = useState(false);
  const [showBudgetOptions, setShowBudgetOptions] = useState(false);

  // ---- TEXT-TO-SPEECH ----
  const getResponseText = (result) => {
    if (!result) return '';
    let text = '';
    if (result.overall_analysis) {
      text += result.overall_analysis + '. ';
    }
    if (result.fertilizers && Array.isArray(result.fertilizers)) {
      result.fertilizers.forEach((f) => {
        text += `${f.name}, ${f.quantity_per_acre} per acre. `;
      });
    }
    if (result.soil_analysis_and_tips && Array.isArray(result.soil_analysis_and_tips)) {
      result.soil_analysis_and_tips.forEach((tip) => {
        text += tip + '. ';
      });
    }
    return text.trim();
  };

  const stoppedByUser = React.useRef(false);

  const handleSpeak = () => {
    const text = getResponseText(aiResult);
    if (!text) return;

    if (isSpeaking) {
      stoppedByUser.current = true;
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    stoppedByUser.current = false;
    const langCode = language === 'Kannada' ? 'kn-IN' : 'en-IN';

    Speech.speak(text, {
      language: langCode,
      rate: 0.9,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        // Only fallback if NOT manually stopped by user
        if (!stoppedByUser.current) {
          Speech.speak(text, {
            rate: 0.9,
            onStart: () => setIsSpeaking(true),
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
          });
        }
      },
    });
  };

  // ---- IMAGE HANDLING (Web + Mobile) ----
  const pickImageCamera = async () => {
    if (Platform.OS === 'web') {
      // Camera not supported on web, use gallery
      pickImageGallery();
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const pickImageGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      let b64 = result.assets[0].base64;
      if (!b64 && Platform.OS === 'web') {
        try {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          b64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result.split(',')[1];
              resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("Failed to read image as base64 on web:", err);
        }
      }
      setImageBase64(b64);
    }
  };

  const handleImageOption = () => {
    if (Platform.OS === 'web') {
      // On web, directly open gallery (file picker)
      pickImageGallery();
      return;
    }
    Alert.alert(
      'Select Image',
      'Choose where to get the image from:',
      [
        { text: 'Take Photo', onPress: pickImageCamera },
        { text: 'Choose from Gallery', onPress: pickImageGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // ---- ASK AI ----
  const handleAsk = async () => {
    if (!question.trim() && !imageBase64) {
      Alert.alert('Error', 'Please enter a question or upload an image');
      return;
    }

    setLoading(true);
    setAiResult(null);
    Speech.stop();
    setIsSpeaking(false);

    try {
      const endpoint = imageBase64 ? '/detect-disease' : '/ask';
      const payload = {
        farmer_id: farmerId,
        question: question.trim() || 'Analyze this crop image',
        language,
      };

      if (imageBase64) {
        payload.image = imageBase64;
      }

      const result = await api.post(endpoint, payload);

      if (!result.data || !result.data.answer) {
        throw new Error('Invalid AI response');
      }

      setAiResult(result.data.answer);
      setQuestion('');
      setImageUri(null);
      setImageBase64(null);
    } catch (error) {
      console.log('ASK ERROR:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not get AI response. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- CREATE SESSION ----
  const handleCreateSessionSubmit = async () => {
    if (!crop || !soilType || !ph) {
      Alert.alert('Error', 'Please fill crop, soil type and soil pH');
      return;
    }

    setLoading(true);
    setAiResult(null);
    Speech.stop();
    setIsSpeaking(false);

    try {
      const result = await api.post('/session', {
        farmer_id: farmerId,
        crop,
        soil_type: soilType,
        ph: Number(ph),
        nitrogen_ppm: Number(nitrogen),
        phosphorus_ppm: Number(phosphorus),
        potassium_ppm: Number(potassium),
        water_availability: waterAvailability,
        budget_range: budgetRange,
        language,
      });

      if (!result.data || !result.data.answer) {
        throw new Error('Invalid AI response');
      }

      setAiResult(result.data.answer);
      setShowSessionModal(false);
    } catch (error) {
      console.log('AI ERROR:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not get AI response. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Language Selection */}
      <View style={s.languageContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Ionicons name="language" size={18} color="#222" />
          <Text style={[s.sectionLabel, { marginLeft: 8 }]}>Select Language:</Text>
        </View>
        <View style={s.langButtons}>
          {['English', 'Kannada'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[s.langButton, language === lang && s.langButtonActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[s.langText, language === lang && s.langTextActive]}>
                {lang === 'English' ? '🇬🇧 English' : '🇮🇳 ಕನ್ನಡ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Create Session Button */}
      <TouchableOpacity
        style={[s.sessionButton, loading && s.buttonDisabled]}
        onPress={() => setShowSessionModal(true)}
        disabled={loading}
      >
        <MaterialCommunityIcons name="plus-circle" size={20} color="#222" />
        <Text style={[s.askButtonText, { marginLeft: 8 }]}>Create Session</Text>
      </TouchableOpacity>

      {/* Ask Area */}
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="robot" size={18} color="#222" />
          <Text style={[s.sectionLabel, { marginLeft: 8 }]}>Ask any farming question:</Text>
        </View>

        {imageUri && (
          <View style={{ position: 'relative', width: 100, height: 100, marginBottom: 10 }}>
            <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
            <TouchableOpacity
              style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#c62828', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setImageUri(null); setImageBase64(null); }}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: '#ddd', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#f5f8f5' }}>
          <TextInput
            style={{ flex: 1, paddingVertical: 12, color: '#333', fontSize: 15 }}
            placeholder="E.g. Why are my tomato leaves turning yellow?"
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={handleImageOption} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="camera" size={24} color="#4a7c2c" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAsk}
            disabled={loading}
            style={{ backgroundColor: '#4a7c2c', padding: 10, borderRadius: 8, marginLeft: 4 }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Session Modal */}
      <Modal visible={showSessionModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
          <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 12, padding: 16, maxHeight: '85%' }}>
            <ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <MaterialCommunityIcons name="sprout" size={22} color="#4a7c2c" />
                <Text style={[s.sectionLabel, { marginLeft: 8, fontSize: 16 }]}>Create Farm Session</Text>
              </View>

              {/* Crop dropdown */}
              <Text style={s.sectionLabel}>Crop</Text>
              <TouchableOpacity onPress={() => setShowCropOptions(!showCropOptions)} style={s.dropdown}>
                <Text>{crop}</Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              {showCropOptions && (
                <View style={s.dropdownList}>
                  {['Wheat', 'Rice', 'Maize', 'Cotton', 'Vegetables', 'Ragi', 'Jowar', 'Sugarcane', 'Arecanut', 'Coffee'].map((opt) => (
                    <TouchableOpacity key={opt} onPress={() => { setCrop(opt); setShowCropOptions(false); }} style={s.dropdownItem}>
                      <Text style={s.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Soil type dropdown */}
              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Soil Type</Text>
              <TouchableOpacity onPress={() => setShowSoilOptions(!showSoilOptions)} style={s.dropdown}>
                <Text>{soilType}</Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              {showSoilOptions && (
                <View style={s.dropdownList}>
                  {['Sandy', 'Loamy', 'Clayey', 'Silty', 'Red Soil', 'Black Soil', 'Laterite'].map((opt) => (
                    <TouchableOpacity key={opt} onPress={() => { setSoilType(opt); setShowSoilOptions(false); }} style={s.dropdownItem}>
                      <Text style={s.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* pH and nutrients */}
              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Soil pH</Text>
              <TextInput style={s.modalInput} keyboardType="numeric" value={ph} onChangeText={setPh} placeholder="e.g. 6.5" />

              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Nitrogen (ppm)</Text>
              <TextInput style={s.modalInput} keyboardType="numeric" value={nitrogen} onChangeText={setNitrogen} placeholder="e.g. 10" />

              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Phosphorus (ppm)</Text>
              <TextInput style={s.modalInput} keyboardType="numeric" value={phosphorus} onChangeText={setPhosphorus} placeholder="e.g. 10" />

              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Potassium (ppm)</Text>
              <TextInput style={s.modalInput} keyboardType="numeric" value={potassium} onChangeText={setPotassium} placeholder="e.g. 10" />

              {/* Water availability */}
              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Water Availability</Text>
              <TouchableOpacity onPress={() => setShowWaterOptions(!showWaterOptions)} style={s.dropdown}>
                <Text>{waterAvailability}</Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              {showWaterOptions && (
                <View style={s.dropdownList}>
                  {['Low', 'Moderate', 'High'].map((opt) => (
                    <TouchableOpacity key={opt} onPress={() => { setWaterAvailability(opt); setShowWaterOptions(false); }} style={s.dropdownItem}>
                      <Text style={s.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Budget range */}
              <Text style={[s.sectionLabel, { marginTop: 10 }]}>Budget Range</Text>
              <TouchableOpacity onPress={() => setShowBudgetOptions(!showBudgetOptions)} style={s.dropdown}>
                <Text>{budgetRange}</Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              {showBudgetOptions && (
                <View style={s.dropdownList}>
                  {['Low', 'Medium', 'High'].map((opt) => (
                    <TouchableOpacity key={opt} onPress={() => { setBudgetRange(opt); setShowBudgetOptions(false); }} style={s.dropdownItem}>
                      <Text style={s.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Modal actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity onPress={() => setShowSessionModal(false)} style={[s.modalButton, s.cancelButton]}>
                  <Ionicons name="close-circle-outline" size={18} color="#4a7c2c" />
                  <Text style={[s.cancelButtonText, { marginLeft: 6 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateSessionSubmit} style={[s.modalButton, s.submitButton]}>
                  {loading ? <ActivityIndicator color="white" /> : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={18} color="white" />
                      <Text style={[s.submitButtonText, { marginLeft: 6 }]}>Get Recommendations</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Response */}
      {aiResult ? (
        <ScrollView>
          {/* TTS Speaker Button */}
          <TouchableOpacity
            onPress={handleSpeak}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isSpeaking ? '#c62828' : '#1565c0',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <Ionicons
              name={isSpeaking ? 'stop-circle' : 'volume-high'}
              size={20}
              color="white"
            />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 15 }}>
              {isSpeaking ? 'Stop Speaking' : `🔊 Listen in ${language}`}
            </Text>
          </TouchableOpacity>

          {/* Fertilizer Recommendations Box */}
          {aiResult.fertilizers && Array.isArray(aiResult.fertilizers) && aiResult.fertilizers.length > 0 && (
            <View style={s.fertilizerBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <MaterialCommunityIcons name="leaf" size={20} color="#4a7c2c" />
                <Text style={[s.boxTitle, { marginBottom: 0, marginLeft: 8 }]}>Fertilizer Recommendations</Text>
              </View>
              {aiResult.fertilizers.map((fert, idx) => (
                <View key={idx} style={s.fertilizerItem}>
                  <Text style={s.fertilizerName}>{fert.name}</Text>
                  <Text style={s.fertilizerQuantity}>Quantity: {fert.quantity_per_acre} per acre</Text>
                </View>
              ))}
            </View>
          )}

          {/* Overall Analysis Box */}
          {aiResult.overall_analysis && (
            <View style={s.analysisBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name="clipboard-text" size={20} color="#ff9800" />
                <Text style={[s.boxTitle, { marginBottom: 0, marginLeft: 8, color: '#e65100' }]}>Overall Analysis</Text>
              </View>
              <Text style={s.analysisText}>{aiResult.overall_analysis}</Text>
            </View>
          )}

          {/* Soil Analysis & Tips Box */}
          {aiResult.soil_analysis_and_tips && Array.isArray(aiResult.soil_analysis_and_tips) && aiResult.soil_analysis_and_tips.length > 0 && (
            <View style={s.soilTipsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name="sprout" size={20} color="#2196f3" />
                <Text style={[s.boxTitle, { marginBottom: 0, marginLeft: 8, color: '#1565c0' }]}>Soil Analysis & Tips</Text>
              </View>
              {aiResult.soil_analysis_and_tips.map((tip, idx) => (
                <View key={idx} style={s.tipItem}>
                  <Text style={s.tipText}>• {tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Fallback: render any remaining fields */}
          {Object.keys(aiResult).filter(key => !['fertilizers', 'overall_analysis', 'soil_analysis_and_tips'].includes(key)).length > 0 && (
            <View style={{ marginTop: 15, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>Additional Information:</Text>
              {Object.keys(aiResult).filter(key => !['fertilizers', 'overall_analysis', 'soil_analysis_and_tips'].includes(key)).map(key => (
                <View key={key} style={{ marginTop: 6 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>{key}:</Text>
                  <SafeText value={aiResult[key]} textStyle={s.analysisText} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  languageContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 0,
  },
  langButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  langButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4a7c2c',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#4a7c2c',
  },
  langText: {
    color: '#4a7c2c',
    fontWeight: '600',
    fontSize: 14,
  },
  langTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sessionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  askButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dropdown: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    color: '#333',
    fontSize: 15,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#e8f5e9',
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#4a7c2c',
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#4a7c2c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fertilizerBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#4a7c2c',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a7c2c',
    marginBottom: 12,
  },
  fertilizerItem: {
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4a7c2c',
  },
  fertilizerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  fertilizerQuantity: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  analysisBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9800',
  },
  analysisText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  soilTipsBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
  },
  tipItem: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});
