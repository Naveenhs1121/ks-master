// ============================
// frontend/app/index.js
// Entry point of the Expo application. Immediately
// redirects user to the login screen on launch.
// ----------------------------
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login screen on app start
  return <Redirect href="/home" />;
}