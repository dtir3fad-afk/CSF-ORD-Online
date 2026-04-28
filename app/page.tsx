'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import AdminCSFManager from '@/components/AdminCSFManager';
import Responses from '@/components/Responses';
import Analytics from '@/components/Analytics';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'manage':
        return <AdminCSFManager />;
      case 'responses':
        return <Responses />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      manage: 'Manage CSFs',
      responses: 'Responses',
      analytics: 'Analytics'
    };
    return titles[activeTab as keyof typeof titles] || 'Dashboard';
  };

  return (
    <ProtectedRoute>
      <div className="app">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{getPageTitle()}</div>
            <div className="topbar-actions">
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {new Date().toLocaleDateString('en-PH', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <button 
                className="btn-sm btn-primary"
                onClick={() => setActiveTab('manage')}
              >
                + Create CSF
              </button>
            </div>
          </div>
          
          <div className="content">
            {renderContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}