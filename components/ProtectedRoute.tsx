'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { user, adminUser, loading, hasAdminRole, hasSuperAdminRole } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-background-tertiary)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #1A4B8C',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)'
          }}>
            Verifying authentication...
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user || !hasAdminRole) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && !hasSuperAdminRole) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-background-tertiary)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px'
          }}>
            🚫
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#dc2626',
            marginBottom: '12px'
          }}>
            Access Denied
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '20px'
          }}>
            You don't have sufficient privileges to access this area. Super admin role required.
          </p>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            background: '#f9fafb',
            padding: '12px',
            borderRadius: '8px'
          }}>
            Current role: {adminUser?.role || 'Unknown'}<br />
            Contact your system administrator for access.
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}