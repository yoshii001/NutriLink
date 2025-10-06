import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

// app.config.ts ensures Expo has access to the public env vars at build time.
// It maps environment variables (process.env.*) to expo.extra and exposes
// public ones as EXPO_PUBLIC_* so they are available to the JS runtime.

export default ({ config }: ConfigContext): ExpoConfig => {
  const updated: ExpoConfig = {
    ...config,
    name: config.name ?? 'NutriLink',
    slug: (config.slug as string) ?? 'nutrilink',
    extra: {
      // non-public secrets (do not prefix with EXPO_PUBLIC_) can go here if
      // you want them injected via eas secrets or CI, but avoid checking them in.
    },
    // Expose the Firebase config as public runtime env vars for the app.
    // Use EXPO_PUBLIC_* prefix so Expo will include them in the JS bundle.
    runtimeVersion: {
      policy: 'appVersion',
    },
    owner: config.owner,
  } as ExpoConfig;

  // Map expected environment variables into process.env at build time.
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN;
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID;
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;
  process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID;

  return updated;
};
