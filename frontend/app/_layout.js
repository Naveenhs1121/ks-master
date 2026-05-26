// ============================
// frontend/app/_layout.js
// Configures the navigation stack for the Expo Router.
// Defines which screens are available and sets common
// header styles. File is intentionally minimal.
// ----------------------------
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4a7c2c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ title: '🌾 ರೈತ AI ಲಾಗಿನ್', headerShown: false }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ title: 'ರೈತ ನೋಂದಣಿ', headerShown: false }} 
      />
      <Stack.Screen 
        name="home" 
        options={{ title: 'ರೈತ AI ಸಹಾಯಕ', headerShown: false }} 
      />
      <Stack.Screen 
        name="history" 
        options={{ title: 'ಪ್ರಶ್ನೆ ಇತಿಹಾಸ' }} 
      />
    </Stack>
  );
}