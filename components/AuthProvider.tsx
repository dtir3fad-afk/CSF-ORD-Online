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
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      try {
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

    return () => unsubscribe();
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
      {children}
    </AuthContext.Provider>
  );
}