import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };

// Only connect to emulators in development and if not already connected
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check if emulators are already connected to avoid reconnection errors
  try {
    // These will only connect if not already connected
    if (!auth._delegate._config?.emulator) {
      // connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (!db._delegate._databaseId?.projectId?.includes('demo-')) {
      // connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators not connected:', error.message);
  }
}

export default app;