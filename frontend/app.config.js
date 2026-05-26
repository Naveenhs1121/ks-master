// ============================
// frontend/app.config.js
// Expo configuration that injects environment
// variables into the app bundle. Uses dotenv to
// load BACKEND_URL and GEMINI_API_KEY for runtime
// access via process.env.
// ----------------------------
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    BACKEND_URL: process.env.BACKEND_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    // Add more env variables here as needed
  },
});
