'use client';

import { Suspense } from 'react';
import CustomerCSFView from '@/components/CustomerCSFView';

export default function CSFPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Loading CSF...
        </div>
      </div>
    }>
      <CustomerCSFView />
    </Suspense>
  );
}