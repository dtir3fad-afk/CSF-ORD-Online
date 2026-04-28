/**
 * Create Sample Data for Testing
 * This script creates sample CSF templates so you can test the system
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

async function createSampleData() {
  try {
    console.log('🚀 Creating sample CSF templates...\n');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Sample CSF Templates with realistic document URLs
    // Note: In production, these would be actual uploaded documents
    const sampleTemplates = [
      {
        title: 'Q1 2024 Business Registration Feedback',
        description: 'Quarterly feedback collection for business registration services including name registration, permits, and licensing.',
        previewFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Fpreviews%2Fbusiness-registration-guide.pdf?alt=media',
        fullFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Ffull%2Fbusiness-registration-guide.pdf?alt=media',
        createdBy: 'DTI Regional Director',
        createdAt: new Date().toISOString(),
        isActive: true,
        recipients: [
          'business.owner@example.com',
          'startup.founder@example.com',
          'entrepreneur@example.com'
        ]
      },
      {
        title: 'Consumer Protection Services Review',
        description: 'Annual review of consumer complaint resolution, mediation services, and consumer education programs.',
        previewFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Fpreviews%2Fconsumer-protection-handbook.pdf?alt=media',
        fullFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Ffull%2Fconsumer-protection-handbook.pdf?alt=media',
        createdBy: 'Consumer Protection Officer',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isActive: true,
        recipients: [
          'consumer.advocate@example.com',
          'concerned.citizen@example.com'
        ]
      },
      {
        title: 'Export Certification & Documentation',
        description: 'Feedback on export certification processes, documentation requirements, and trade facilitation services.',
        previewFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Fpreviews%2Fexport-certification-manual.pdf?alt=media',
        fullFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Ffull%2Fexport-certification-manual.pdf?alt=media',
        createdBy: 'Trade Promotion Officer',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isActive: true,
        recipients: [
          'exporter@example.com',
          'trade.company@example.com',
          'international.trader@example.com'
        ]
      },
      {
        title: 'MSME Development Program Evaluation',
        description: 'Evaluation of Micro, Small, and Medium Enterprise development programs, training, and support services.',
        previewFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Fpreviews%2Fmsme-development-guide.pdf?alt=media',
        fullFileUrl: 'https://firebasestorage.googleapis.com/v0/b/your-project/o/documents%2Ffull%2Fmsme-development-guide.pdf?alt=media',
        createdBy: 'MSME Development Officer',
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        isActive: false, // Inactive for testing
        recipients: [
          'small.business@example.com',
          'micro.enterprise@example.com'
        ]
      }
    ];

    console.log('📝 Creating CSF templates...');
    const templateIds = [];
    
    for (const template of sampleTemplates) {
      const docRef = await addDoc(collection(db, 'csf_templates'), template);
      templateIds.push(docRef.id);
      console.log(`✅ Created: "${template.title}" (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📋 What you can test now:');
    console.log('1. Go to "Manage CSFs" to see the sample templates');
    console.log('2. Click "Preview Email" to see what recipients will receive');
    console.log('3. Click "Copy Link" to get the CSF form URL');
    console.log('4. Click "Test CSF Form" to experience the customer journey');
    console.log('5. Create your own CSF template using "Create New CSF"');
    
    console.log('\n🔗 Sample CSF Links:');
    templateIds.forEach((id, index) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      console.log(`${index + 1}. ${baseUrl}/csf?id=${id}`);
    });
    
    console.log('\n💡 Pro Tips:');
    console.log('• Use the "Preview Email" button to see the professional email template');
    console.log('• Test the customer experience by opening a CSF link');
    console.log('• Complete a form to see the document unlock feature');
    console.log('• Check the Dashboard, Responses, and Analytics after submitting forms');
    console.log('• Upload real documents when creating new CSF templates for actual file downloads');
    
    console.log('\n⚠️  Note about sample documents:');
    console.log('• Sample templates use placeholder document URLs');
    console.log('• To test real document downloads, create a new CSF and upload an actual file');
    console.log('• The system will then download the real document you uploaded');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Permission denied - make sure:');
      console.log('1. Firestore Database is created in Firebase Console');
      console.log('2. Database is in test mode or rules allow writes');
      console.log('3. Your Firebase configuration is correct');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Firebase configuration in .env.local');
      console.log('3. Ensure Firestore is enabled in your Firebase project');
    }
  }
}

createSampleData();