/**
 * Fix Admin Access - Create Admin User and Test System
 * Run this script to create an admin user and verify the system works
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';

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

async function fixAdminAccess() {
  try {
    console.log('🔧 Fixing admin access issues...\n');
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Admin user details
    const adminEmail = 'admin@dti.gov.ph';
    const adminPassword = 'DTI@Admin2024!';
    
    console.log('👤 Creating admin user...');
    
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      console.log(`✅ Firebase Auth user created: ${user.uid}`);
      
      // Create admin user document in Firestore
      const adminUserData = {
        email: adminEmail,
        role: 'super_admin',
        name: 'DTI System Administrator',
        department: 'Information Technology',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0
      };
      
      await setDoc(doc(db, 'admin_users', user.uid), adminUserData);
      console.log('✅ Admin user document created in Firestore');
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  Admin user already exists, checking Firestore document...');
        
        // Get existing user and ensure Firestore document exists
        const existingUsers = await getDocs(collection(db, 'admin_users'));
        let adminFound = false;
        
        existingUsers.forEach((doc) => {
          const data = doc.data();
          if (data.email === adminEmail) {
            adminFound = true;
            console.log(`✅ Admin user found in Firestore: ${doc.id}`);
          }
        });
        
        if (!adminFound) {
          console.log('⚠️  Admin user exists in Auth but not in Firestore');
          console.log('   Please manually create the Firestore document or delete the Auth user');
        }
      } else {
        throw error;
      }
    }
    
    console.log('\n🧪 Testing system access...');
    
    // Test Firestore access
    try {
      const templates = await getDocs(collection(db, 'csf_templates'));
      console.log(`✅ Firestore access working - found ${templates.size} CSF templates`);
    } catch (error: any) {
      console.log(`❌ Firestore access failed: ${error.message}`);
    }
    
    console.log('\n🎉 Admin access setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    console.log('\n🔄 Next Steps:');
    console.log('1. Deploy the updated Firestore rules');
    console.log('2. Deploy the updated Storage rules');
    console.log('3. Login to the system with the credentials above');
    console.log('4. Test creating a new CSF template');
    
    console.log('\n⚠️  Important Security Notes:');
    console.log('• Change the default password after first login');
    console.log('• The rules now check admin status via Firestore documents');
    console.log('• Make sure to deploy both Firestore and Storage rules');
    
  } catch (error) {
    console.error('❌ Error fixing admin access:', error);
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Permission denied - make sure:');
      console.log('1. Firestore Database is created and accessible');
      console.log('2. Firebase Auth is enabled');
      console.log('3. Your Firebase configuration is correct');
      console.log('4. You have the right permissions in Firebase Console');
    }
  }
}

fixAdminAccess();