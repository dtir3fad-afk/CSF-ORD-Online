/**
 * Admin User Setup Script
 * 
 * This script creates initial admin users for the DTI CSF system.
 * Run with: npx tsx scripts/setup-admin-users.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default admin users to create
const defaultAdmins = [
  {
    email: 'admin@dti.gov.ph',
    password: 'DTI@Admin2024!',
    name: 'DTI System Administrator',
    role: 'super_admin' as const,
    department: 'Information Technology'
  },
  {
    email: 'csf.admin@dti.gov.ph', 
    password: 'CSF@Admin2024!',
    name: 'CSF Administrator',
    role: 'admin' as const,
    department: 'Client Services'
  },
  {
    email: 'regional.admin@dti.gov.ph',
    password: 'Regional@2024!',
    name: 'Regional Administrator',
    role: 'admin' as const,
    department: 'Regional Office'
  }
];

async function createAdminUser(adminData: typeof defaultAdmins[0]) {
  try {
    console.log(`Creating admin user: ${adminData.email}`);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      adminData.email, 
      adminData.password
    );
    
    const user = userCredential.user;
    
    // Create admin user document
    const adminUserData = {
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      department: adminData.department,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      lastLogin: null,
      loginAttempts: 0
    };
    
    await setDoc(doc(db, 'admin_users', user.uid), adminUserData);
    
    // Initialize user security document
    const securityData = {
      email: adminData.email,
      loginAttempts: 0,
      lockedUntil: null,
      lastSuccessfulLogin: null,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'user_security', adminData.email), securityData);
    
    console.log(`✅ Successfully created admin: ${adminData.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Role: ${adminData.role}`);
    console.log(`   Department: ${adminData.department}`);
    
    return { success: true, uid: user.uid };
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${adminData.email}`);
      return { success: false, error: 'User already exists' };
    } else {
      console.error(`❌ Failed to create ${adminData.email}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

async function setupAdminUsers() {
  console.log('🔐 Setting up DTI CSF Admin Users...\n');
  
  const results = [];
  
  for (const admin of defaultAdmins) {
    const result = await createAdminUser(admin);
    results.push({ ...admin, ...result });
    console.log(''); // Add spacing
  }
  
  // Summary
  console.log('📊 Setup Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} admin(s)`);
  console.log(`❌ Failed: ${failed.length} admin(s)`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Admin users ready for login:');
    successful.forEach(admin => {
      console.log(`   📧 ${admin.email}`);
      console.log(`   🔑 ${admin.password}`);
      console.log(`   👤 ${admin.role}`);
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed to create:');
    failed.forEach(admin => {
      console.log(`   📧 ${admin.email} - ${admin.error}`);
    });
  }
  
  console.log('\n🔒 Security Reminders:');
  console.log('• Change default passwords after first login');
  console.log('• Enable 2FA for production environments');
  console.log('• Regularly audit admin user access');
  console.log('• Monitor login attempts and security logs');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy Firestore security rules');
  console.log('2. Test login with created admin accounts');
  console.log('3. Configure email service for notifications');
  console.log('4. Set up monitoring and alerts');
}

// Run the setup
if (require.main === module) {
  setupAdminUsers()
    .then(() => {
      console.log('\n✅ Admin user setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupAdminUsers };