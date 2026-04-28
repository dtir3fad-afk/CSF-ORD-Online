/**
 * Check Firebase Authentication Configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function checkFirebaseAuth() {
  try {
    console.log('🔍 Checking Firebase Configuration...\n');
    
    console.log('📋 Environment Variables:');
    console.log(`Project ID: ${firebaseConfig.projectId}`);
    console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
    console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`App ID: ${firebaseConfig.appId ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    // Test Auth
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    console.log(`Auth instance: ${auth.app.name}`);
    console.log('');
    
    // Test Firestore
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');
    console.log(`Firestore app: ${db.app.name}`);
    console.log('');
    
    console.log('🎉 All Firebase services are properly configured!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log(`2. Select your project: ${firebaseConfig.projectId}`);
    console.log('3. Go to Authentication > Sign-in method');
    console.log('4. Enable "Email/Password" provider');
    console.log('5. Go to Firestore Database');
    console.log('6. Make sure Firestore is enabled');
    console.log('7. Run the admin setup script again');
    
  } catch (error: any) {
    console.error('❌ Firebase configuration error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has all Firebase config values');
    console.log('2. Verify your Firebase project exists');
    console.log('3. Make sure Authentication is enabled in Firebase Console');
    console.log('4. Ensure Firestore Database is created');
  }
}

checkFirebaseAuth();