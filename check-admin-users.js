// Quick script to check if there are admin users in Firestore
// Run this in browser console on your site to see what admin users exist

async function checkAdminUsers() {
  try {
    // Get Firebase instances
    const { getFirebaseDb } = await import('./lib/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const db = getFirebaseDb();
    if (!db) {
      console.log('❌ Firebase not initialized');
      return;
    }
    
    const adminUsersRef = collection(db, 'admin_users');
    const snapshot = await getDocs(adminUsersRef);
    
    console.log('👥 Admin users in database:');
    console.log('Total count:', snapshot.size);
    
    snapshot.forEach((doc) => {
      console.log('User ID:', doc.id);
      console.log('Data:', doc.data());
      console.log('---');
    });
    
    if (snapshot.empty) {
      console.log('✅ No admin users found - this explains why auto-login might not work');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  }
}

// Run the check
checkAdminUsers();