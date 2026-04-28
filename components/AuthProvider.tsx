'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthService, AdminUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasAdminRole: boolean;
  hasSuperAdminRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasSuperAdminRole, setHasSuperAdminRole] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('⏰ Auth initialization timeout, setting loading to false');
          setLoading(false);
        }, 10000); // 10 second timeout

        // Try to set up auth state listener
        unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
          try {
            clearTimeout(timeoutId);
            console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.email : 'signed out');
            setUser(firebaseUser);
            
            if (firebaseUser) {
              console.log('👤 Getting admin user data for:', firebaseUser.uid);
              
              // Get admin user data
              const adminUserData = await AuthService.getAdminUser(firebaseUser.uid);
              console.log('📄 Admin user data:', adminUserData);
              
              setAdminUser(adminUserData);
              
              if (adminUserData) {
                // Check roles
                const isAdmin = await AuthService.hasAdminRole(firebaseUser.uid);
                const isSuperAdmin = await AuthService.hasSuperAdminRole(firebaseUser.uid);
                
                console.log('🔐 Role check - Admin:', isAdmin, 'Super Admin:', isSuperAdmin);
                
                setHasAdminRole(isAdmin);
                setHasSuperAdminRole(isSuperAdmin);
                
                // If user doesn't have admin role, sign them out
                if (!isAdmin) {
                  console.log('❌ User does not have admin role, signing out');
                  await AuthService.signOut();
                  setUser(null);
                  setAdminUser(null);
                  setHasAdminRole(false);
                  setHasSuperAdminRole(false);
                } else {
                  console.log('✅ User has admin access');
                }
              } else {
                console.log('❌ No admin user data found, signing out');
                await AuthService.signOut();
                setUser(null);
                setAdminUser(null);
                setHasAdminRole(false);
                setHasSuperAdminRole(false);
              }
            } else {
              setAdminUser(null);
              setHasAdminRole(false);
              setHasSuperAdminRole(false);
            }
          } catch (error: any) {
            console.error('❌ Auth state change error:', error);
            console.error('Error details:', {
              code: error.code,
              message: error.message,
              stack: error.stack
            });
            setUser(null);
            setAdminUser(null);
            setHasAdminRole(false);
            setHasSuperAdminRole(false);
          } finally {
            setLoading(false);
          }
        });

        // If unsubscribe is empty function (Firebase not available), set loading to false
        if (typeof unsubscribe === 'function' && unsubscribe.toString().includes('return')) {
          console.log('🔥 Firebase auth initialized successfully');
        } else {
          console.log('⚠️ Firebase auth not available, setting loading to false');
          clearTimeout(timeoutId);
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    adminUser,
    loading,
    signOut,
    hasAdminRole,
    hasSuperAdminRole
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--color-background-primary)',
          color: 'var(--color-text-primary)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--color-border-secondary)',
            borderTop: '3px solid #1A4B8C',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Verifying authentication...
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Connecting to Firebase services
          </div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}