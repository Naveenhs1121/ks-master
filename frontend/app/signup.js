// frontend/app/signup.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "./api";

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !phone || !password) {
      Alert.alert("ದೋಷ", "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ");
      return;
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert("ದೋಷ", "ಫೋನ್ ನಂಬರ್ 10 ಅಂಕಿಗಳಾಗಿರಬೇಕು");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/signup", {
        name,
        phone,
        password,
        village,
      });

      if (response.data.success) {
        Alert.alert(
          "ಯಶಸ್ವಿ",
          "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
          [{ text: "OK", onPress: () => router.push("/login") }]
        );
      } else {
        Alert.alert("ದೋಷ", response.data.message || "ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ");
      }
    } catch (error) {
      console.log("❌ SIGNUP ERROR:", error?.response || error);
      Alert.alert(
        "ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ",
        error.response?.data?.message || "ನೆಟ್‌ವರ್ಕ್ / ಸರ್ವರ್ ದೋಷ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#e8f5e9", "#a5d6a7", "#66bb6a"]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Branding */}
          <View style={styles.brandSection}>
            <Text style={styles.emoji}>🌱</Text>
            <Text style={styles.title}>ರೈತ ನೋಂದಣಿ</Text>
            <Text style={styles.subtitle}>Farmer Registration</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಹೆಸರು (Full Name) *"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಫೋನ್ ನಂಬರ್ (Phone) *"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#999"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಪಾಸ್‌ವರ್ಡ್ (Password) *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Village */}
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಹಳ್ಳಿ ಹೆಸರು (Village Name)"
                value={village}
                onChangeText={setVillage}
                placeholderTextColor="#999"
              />
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ["#81c784", "#81c784"] : ["#2e7d32", "#1b5e20"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "ನೋಂದಣಿ ಆಗುತ್ತಿದೆ..." : "ನೋಂದಣಿ ಮಾಡಿ (Register)"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity onPress={() => router.push("/login")} style={styles.loginLink}>
            <Text style={styles.linkText}>
              ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ
            </Text>
            <Text style={styles.linkSubtext}>
              (Already have an account? Login)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#2e7d32",
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f8f5",
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e0e8e0",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 6,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 28,
  },
  linkText: {
    color: "#1b5e20",
    fontSize: 15,
    fontWeight: "600",
  },
  linkSubtext: {
    color: "#33691e",
    fontSize: 13,
    marginTop: 4,
    opacity: 0.8,
  },
});