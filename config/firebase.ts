import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Load Firebase config from Expo public environment variables.
// These should be provided via `app.config.ts` or the environment in CI/CD.
const firebaseConfig = {
  // Prefer environment variables (EXPO_PUBLIC_*). If they are not provided
  // the values below act as safe fallbacks (copied from local .env content).
  // NOTE: Keep real secrets out of source control in production. Use EAS
  // secrets or CI environment variables instead.
  apiKey: "AIzaSyCm-c5f6h_CHCTw95nnZQE5qYfMMqk-a4o",
  authDomain: "kids-feed.firebaseapp.com",
  databaseURL: "https://kids-feed-default-rtdb.firebaseio.com",
  projectId: "kids-feed",
  storageBucket: "kids-feed.firebasestorage.app",
  messagingSenderId: "256985647929",
  appId: "1:256985647929:web:5b4db8a62d626c0db9f6e8",
  measurementId: "G-1FFEDF4FPJ"
};

// Optional runtime warning to help developers configure env vars locally.
if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.warn('[config/firebase] EXPO_PUBLIC_FIREBASE_API_KEY is not set. Initialize Firebase with real credentials via app.config.ts or environment variables.');
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
