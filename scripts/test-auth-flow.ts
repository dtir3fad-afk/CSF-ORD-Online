/**
 * Test Authentication Flow
 * This script tests the complete authentication flow to identify issues
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    const testEmail = 'admin@dti.gov.ph';
    const testPassword = 'DTI@Admin2024!';
    
    console.log('1️⃣ Testing Firebase Auth Login...');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log(`✅ Firebase Auth successful`);
      console.log(`   User UID: ${user.uid}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      
      console.log('\n2️⃣ Testing Firestore Admin Document Access...');
      
      try {
        const adminDocRef = doc(db, 'admin_users', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          console.log('✅ Admin document found');
          console.log('   Admin Data:', JSON.stringify(adminData, null, 2));
          
          // Check required fields
          const requiredFields = ['email', 'role', 'isActive', 'name'];
          const missingFields = requiredFields.filter(field => !(field in adminData));
          
          if (missingFields.length > 0) {
            console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`);
          } else {
            console.log('✅ All required fields present');
          }
          
          // Check isActive status
          if (adminData.isActive === true) {
            console.log('✅ User is active');
          } else {
            console.log('❌ User is not active:', adminData.isActive);
          }
          
        } else {
          console.log('❌ Admin document not found');
          console.log('   Expected path: admin_users/' + user.uid);
        }
        
      } catch (firestoreError: any) {
        console.log('❌ Firestore access failed:', firestoreError.message);
        console.log('   Error code:', firestoreError.code);
        
        if (firestoreError.code === 'permission-denied') {
          console.log('   This suggests Firestore rules are blocking access');
        }
      }
      
      console.log('\n3️⃣ Testing Firestore Rules...');
      
      try {
        // Test reading CSF templates (should work for authenticated users)
        const { collection, getDocs } = await import('firebase/firestore');
        const templatesSnapshot = await getDocs(collection(db, 'csf_templates'));
        console.log(`✅ CSF Templates access: ${templatesSnapshot.size} documents`);
      } catch (error: any) {
        console.log('❌ CSF Templates access failed:', error.message);
      }
      
      // Sign out
      await auth.signOut();
      console.log('\n✅ Signed out successfully');
      
    } catch (authError: any) {
      console.log('❌ Firebase Auth failed:', authError.message);
      console.log('   Error code:', authError.code);
      
      if (authError.code === 'auth/user-not-found') {
        console.log('   User does not exist in Firebase Auth');
      } else if (authError.code === 'auth/wrong-password') {
        console.log('   Incorrect password');
      }
    }
    
    console.log('\n🔍 Diagnostic Summary:');
    console.log('======================');
    console.log('• Check if Firebase Auth login works');
    console.log('• Check if admin document exists and is readable');
    console.log('• Check if Firestore rules allow proper access');
    console.log('• Verify all required fields are present');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthFlow();