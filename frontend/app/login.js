// ============================
// frontend/app/login.js
// ============================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "./api"; // ✅ USE SHARED AXIOS INSTANCE

export default function LoginScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // 🔐 Basic validation
    if (!phone || !password) {
      Alert.alert("ದೋಷ", "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ");
      return;
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert("ದೋಷ", "ಫೋನ್ ನಂಬರ್ 10 ಅಂಕಿಗಳಾಗಿರಬೇಕು");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login", {
        phone,
        password,
      });

      if (response.data.success) {
        router.push({
          pathname: "/home",
          params: {
            farmerId: response.data.farmer_id,
            farmerName: response.data.name,
          },
        });
      } else {
        Alert.alert("ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ", response.data.message || "ಅಮಾನ್ಯ ರುಜುವಾತುಗಳು");
      }
    } catch (error) {
      console.log("❌ LOGIN ERROR:", error?.response || error);

      Alert.alert(
        "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ",
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
        <View style={styles.content}>
          {/* App branding */}
          <View style={styles.brandSection}>
            <Text style={styles.emoji}>🌾</Text>
            <Text style={styles.title}>ರೈತ AI ಸಹಾಯಕ</Text>
            <Text style={styles.subtitle}>Kisan AI Assistant</Text>
            <Text style={styles.description}>
              AI ನಿಂದ ತಕ್ಷಣದ ಕೃಷಿ ಸಲಹೆ ಪಡೆಯಿರಿ
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            {/* Phone input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಫೋನ್ ನಂಬರ್ (Phone Number)"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#999"
              />
            </View>

            {/* Password input with show/hide toggle */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#4a7c2c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ಪಾಸ್‌ವರ್ಡ್ (Password)"
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

            {/* Forgot password link */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?
              </Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
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
                  {loading ? "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ..." : "ಲಾಗಿನ್ (Login)"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity onPress={() => router.push("/signup")} style={styles.registerLink}>
            <Text style={styles.linkText}>
              ಹೊಸ ರೈತರೇ? ಇಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ
            </Text>
            <Text style={styles.linkSubtext}>
              (New Farmer? Register Here)
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    color: "#33691e",
    opacity: 0.85,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 18,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: "#2e7d32",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
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
  registerLink: {
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