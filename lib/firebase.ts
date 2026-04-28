import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on client side and if config is valid
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initializeFirebase() {
  // Only initialize on client side and if not already initialized
  if (typeof window !== 'undefined' && !app) {
    // Check if we have valid config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase configuration is incomplete. Some features may not work.');
      return null;
    }

    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      db = getFirestore(app);
      auth = getAuth(app);
      return app;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return null;
    }
  }
  return app;
}

// Getter functions that ensure Firebase is initialized
export function getFirebaseApp(): FirebaseApp | null {
  if (!app) {
    initializeFirebase();
  }
  return app;
}

export function getFirebaseDb(): Firestore | null {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

// For backward compatibility, export the getter functions as the original names
export { getFirebaseDb as db, getFirebaseAuth as auth, getFirebaseApp as app };

export default getFirebaseApp;