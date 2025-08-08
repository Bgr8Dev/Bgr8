import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent, isSupported, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration - use minimal config for emulators in dev
const getFirebaseConfig = () => {
  // For emulators, we only need minimal config
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    return {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    };
  }

  // Production configuration
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

const firebaseConfig = getFirebaseConfig();

// Validate that critical environment variables exist
const validateEnvVariables = () => {
  const criticalVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingCriticalVars = criticalVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingCriticalVars.length > 0) {
    throw new Error(
      `Missing critical Firebase environment variables: ${missingCriticalVars.join(', ')}. 
      Please check your .env file and build configuration.`
    );
  }

  // Log warning for non-critical missing vars
  const nonCriticalVars = [
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];

  const missingNonCriticalVars = nonCriticalVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingNonCriticalVars.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `Missing non-critical Firebase environment variables: ${missingNonCriticalVars.join(', ')}. 
      Some features may be limited.`
    );
  }
};

// Validate environment variables before initializing Firebase (skip for emulators)
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  console.log('Using emulators - skipping environment variable validation');
}
else {
  validateEnvVariables();
}


// Initialize Firebase App
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log(`Firebase initialized successfully - Mode: ${import.meta.env.VITE_USE_EMULATORS === 'true' ? 'EMULATORS' : 'PRODUCTION'}`);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Initialize Firebase services with error handling
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if configured
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  console.log('🔧 Connecting to Firebase emulators...');
  
  // Connect to Firestore emulator
  import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Connected to Firestore emulator on localhost:8080');
    } catch (error) {
      console.log('⚠️ Firestore emulator connection:', error instanceof Error ? error.message : 'Connection failed');
    }
  });

  // Connect to Storage emulator
  import('firebase/storage').then(({ connectStorageEmulator }) => {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Connected to Storage emulator on localhost:9199');
    } catch (error) {
      console.log('⚠️ Storage emulator connection:', error instanceof Error ? error.message : 'Connection failed');
    }
  });
}

// Initialize Analytics conditionally (may not work in all environments)
export let analytics: Analytics | null = null;
const initAnalytics = async () => {
  try {
    if (await isSupported()) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized");
    } else {
      console.log("Firebase Analytics not supported in this environment");
    }
  } catch (error) {
    console.warn("Firebase Analytics initialization failed:", error);
  }
};
initAnalytics();

// Analytics helper function with safety check
export const logAnalyticsEvent = (
  eventName: string, 
  eventParams?: Record<string, string | number | boolean | null>
) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.warn(`Failed to log analytics event '${eventName}':`, error);
    }
  }
}; 