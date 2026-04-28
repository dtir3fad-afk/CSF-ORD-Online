/**
 * Firestore Database Initialization Script
 * 
 * This script sets up the initial database structure and sample data
 * for the DTI CSF Online System.
 * 
 * Run with: npx tsx scripts/init-firestore.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  Timestamp,
  connectFirestoreEmulator 
} from 'firebase/firestore';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Uncomment to use Firestore emulator for local development
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

async function initializeDatabase() {
  console.log('🚀 Initializing Firestore database...');

  try {
    // Sample CSF Templates
    const sampleTemplates = [
      {
        title: 'Q4 2024 Business Registration Feedback',
        description: 'Quarterly feedback collection for business registration services',
        previewFileUrl: 'https://example.com/preview/business-reg-preview.pdf',
        fullFileUrl: 'https://example.com/documents/business-reg-complete.pdf',
        createdBy: 'DTI Admin',
        createdAt: new Date().toISOString(),
        isActive: true,
        recipients: [
          'business1@example.com',
          'business2@example.com',
          'business3@example.com'
        ]
      },
      {
        title: 'Consumer Protection Services Feedback',
        description: 'Feedback collection for consumer complaint resolution services',
        previewFileUrl: 'https://example.com/preview/consumer-preview.pdf',
        fullFileUrl: 'https://example.com/documents/consumer-complete.pdf',
        createdBy: 'DTI Admin',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isActive: true,
        recipients: [
          'consumer1@example.com',
          'consumer2@example.com'
        ]
      },
      {
        title: 'Export Certification Services Review',
        description: 'Annual review of export certification and documentation services',
        previewFileUrl: 'https://example.com/preview/export-preview.pdf',
        fullFileUrl: 'https://example.com/documents/export-complete.pdf',
        createdBy: 'DTI Regional Office',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isActive: false,
        recipients: [
          'exporter1@example.com',
          'exporter2@example.com',
          'exporter3@example.com',
          'exporter4@example.com'
        ]
      }
    ];

    console.log('📝 Creating sample CSF templates...');
    const templateIds = [];
    
    for (const template of sampleTemplates) {
      const docRef = await addDoc(collection(db, 'csf_templates'), template);
      templateIds.push(docRef.id);
      console.log(`✅ Created template: ${template.title} (ID: ${docRef.id})`);
    }

    // Sample CSF Responses
    const sampleResponses = [
      {
        csfId: templateIds[0],
        name: 'Santos, Maria Elena',
        email: 'business1@example.com',
        phone: '+63 917 123 4567',
        ctype: 'Business',
        sex: 'Female',
        age: '35-49',
        service: 'Business name registration',
        cc1: '1', // Saw & know CC
        cc2: '1', // Easy to see
        cc3: '1', // Helped a lot
        ratings: {
          r0: 2, // Overall
          r1: 1, // Responsiveness
          r2: 2, // Reliability
          r3: 2, // Access & Facilities
          r4: 1, // Communication
          r5: 3, // Costs
          r6: 1, // Integrity
          r7: 2, // Assurance
          r8: 2  // Outcome
        },
        reason: '',
        suggest: 'The service was excellent. Staff were very helpful and professional.',
        date: new Date().toISOString(),
        status: 'completed',
        createdAt: Timestamp.now()
      },
      {
        csfId: templateIds[0],
        name: 'Cruz, Juan Carlos',
        email: 'business2@example.com',
        phone: '+63 918 987 6543',
        ctype: 'Business',
        sex: 'Male',
        age: '20-34',
        service: 'DTI permit application',
        cc1: '2', // Know, didn't see
        cc2: '2', // Somewhat
        cc3: '2', // Somewhat
        ratings: {
          r0: 3, // Overall
          r1: 2, // Responsiveness
          r2: 3, // Reliability
          r3: 3, // Access & Facilities
          r4: 2, // Communication
          r5: 4, // Costs
          r6: 2, // Integrity
          r7: 3, // Assurance
          r8: 3  // Outcome
        },
        reason: 'Processing time was longer than expected.',
        suggest: 'Could improve the online application system and reduce processing time.',
        date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: 'completed',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
      },
      {
        csfId: templateIds[1],
        name: 'Reyes, Ana Marie',
        email: 'consumer1@example.com',
        phone: '+63 919 555 1234',
        ctype: 'Citizen',
        sex: 'Female',
        age: '50-64',
        service: 'Consumer complaint resolution',
        cc1: '1', // Saw & know CC
        cc2: '1', // Easy to see
        cc3: '1', // Helped a lot
        ratings: {
          r0: 1, // Overall
          r1: 1, // Responsiveness
          r2: 1, // Reliability
          r3: 2, // Access & Facilities
          r4: 1, // Communication
          r5: 2, // Costs
          r6: 1, // Integrity
          r7: 1, // Assurance
          r8: 1  // Outcome
        },
        reason: '',
        suggest: 'Excellent service! My complaint was resolved quickly and fairly.',
        date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: 'completed',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
      }
    ];

    console.log('📋 Creating sample CSF responses...');
    
    for (const response of sampleResponses) {
      const docRef = await addDoc(collection(db, 'csf_responses'), response);
      console.log(`✅ Created response from: ${response.name} (ID: ${docRef.id})`);
    }

    // Sample Email Notifications
    const sampleNotifications = [
      {
        csfId: templateIds[0],
        recipientEmail: 'business1@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        responseReceived: true,
        responseId: 'response_id_1',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
      },
      {
        csfId: templateIds[0],
        recipientEmail: 'business2@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        responseReceived: true,
        responseId: 'response_id_2',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
      },
      {
        csfId: templateIds[0],
        recipientEmail: 'business3@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        responseReceived: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
      },
      {
        csfId: templateIds[1],
        recipientEmail: 'consumer1@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        responseReceived: true,
        responseId: 'response_id_3',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
      },
      {
        csfId: templateIds[1],
        recipientEmail: 'consumer2@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        responseReceived: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
      }
    ];

    console.log('📧 Creating sample email notifications...');
    
    for (const notification of sampleNotifications) {
      const docRef = await addDoc(collection(db, 'email_notifications'), notification);
      console.log(`✅ Created notification for: ${notification.recipientEmail} (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sampleTemplates.length} CSF templates created`);
    console.log(`   • ${sampleResponses.length} sample responses created`);
    console.log(`   • ${sampleNotifications.length} email notifications created`);
    console.log('\n🚀 Your DTI CSF system is ready to use!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };