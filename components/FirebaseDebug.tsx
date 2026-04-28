'use client';

import { useEffect, useState } from 'react';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';

export default function FirebaseDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkFirebase = () => {
      const info = {
        timestamp: new Date().toISOString(),
        isClient: typeof window !== 'undefined',
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        apiKeyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
        app: null as string | null,
        auth: null as string | null,
        db: null as string | null,
        error: null
      };

      try {
        const app = getFirebaseApp();
        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        info.app = app ? 'initialized' : 'null';
        info.auth = auth ? 'initialized' : 'null';
        info.db = db ? 'initialized' : 'null';
      } catch (error: any) {
        info.error = error.message;
      }

      setDebugInfo(info);
    };

    checkFirebase();
  }, []);

  // Only show in development or if there's an error
  if (process.env.NODE_ENV === 'production' && !debugInfo.error) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '10px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 9999,
      opacity: 0.8
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Firebase Debug</div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}