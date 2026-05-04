'use client';

import { Home, FileText, MessageSquare, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { adminUser, signOut } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'manage', label: 'Manage CSFs', icon: FileText },
    { id: 'responses', label: 'Responses', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      // Force reload to clear any cached state
      window.location.reload();
    }
  };

  const handleClearSession = async () => {
    if (confirm('Clear all authentication data? This will sign you out and clear browser storage.')) {
      try {
        // Clear Firebase auth
        await signOut();
        
        // Clear browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Force reload
        window.location.reload();
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
  };

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">
          <div className="sb-dot">
            <Home size={14} />
          </div>
          <div className="sb-name">DTI CSF<br />System</div>
        </div>
      </div>
      
      <div className="sb-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={14} />
              {item.label}
            </div>
          );
        })}
      </div>

      {/* User Info & Sign Out */}
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '0.5px solid var(--color-border-tertiary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: '#1A4B8C',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={12} color="white" />
          </div>
          <div>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              color: 'var(--color-text-primary)',
              lineHeight: 1.2
            }}>
              {adminUser?.name || 'Admin User'}
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: 'var(--color-text-secondary)',
              textTransform: 'capitalize'
            }}>
              {adminUser?.role?.replace('_', ' ') || 'Admin'}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: 'transparent',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.1s',
            marginBottom: '4px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-background-secondary)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <LogOut size={10} />
          Sign Out
        </button>
        
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleClearSession}
            style={{
              width: '100%',
              padding: '4px 6px',
              background: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '3px',
              fontSize: '9px',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.1s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#dc2626';
            }}
            title="Development only: Clear all auth data"
          >
            Clear Session
          </button>
        )}
      </div>
      
      <div className="sb-footer">
        FM-CSF-SRV Ver.1<br />
        {new Date().toLocaleDateString('en-PH', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </div>
    </div>
  );
}