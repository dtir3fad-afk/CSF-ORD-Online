import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from './firebase';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  loginAttempts?: number;
  lockedUntil?: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Simple rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export class AuthService {
  
  // Basic input sanitization
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.trim().replace(/[<>\"'%;()&+]/g, '').substring(0, 100);
  }
  
  // Email validation
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  }
  
  // Password validation
  static isValidPassword(password: string): { valid: boolean; message: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    return { valid: true, message: 'Password is valid' };
  }
  
  // Rate limiting check
  static isRateLimited(email: string): boolean {
    const attempts = loginAttempts.get(email);
    if (!attempts) return false;
    
    const now = Date.now();
    const timeDiff = now - attempts.lastAttempt;
    
    // Reset counter after 1 hour
    if (timeDiff > 60 * 60 * 1000) {
      loginAttempts.delete(email);
      return false;
    }
    
    return attempts.count >= MAX_LOGIN_ATTEMPTS;
  }
  
  // Record login attempt
  static recordLoginAttempt(email: string, success: boolean) {
    const now = Date.now();
    const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };
    
    if (success) {
      loginAttempts.delete(email);
    } else {
      attempts.count += 1;
      attempts.lastAttempt = now;
      loginAttempts.set(email, attempts);
    }
  }
  
  // Sign in with security checks
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const sanitizedEmail = this.sanitizeInput(email);
      
      if (!this.isValidEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }
      
      // Rate limiting check
      if (this.isRateLimited(sanitizedEmail)) {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      
      // Get auth instance
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase authentication is not available');
      }
      
      // Attempt Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      const firebaseUser = userCredential.user;
      
      // Get admin user data
      const adminUser = await this.getAdminUser(firebaseUser.uid);
      
      if (!adminUser) {
        await signOut(auth);
        throw new Error('Access denied. Admin account not found.');
      }
      
      if (!adminUser.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated. Contact system administrator.');
      }
      
      // Update last login
      await this.updateLastLogin(firebaseUser.uid);
      
      // Record successful login
      this.recordLoginAttempt(sanitizedEmail, true);
      
      return { success: true, user: adminUser };
      
    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      // Handle specific Firebase auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Account temporarily disabled.';
            break;
          default:
            errorMessage = error.message || 'Login failed';
        }
      } else {
        errorMessage = error.message || 'Login failed';
      }
      
      // Record failed login
      if (email) {
        const sanitizedEmail = this.sanitizeInput(email);
        this.recordLoginAttempt(sanitizedEmail, false);
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  // Sign out
  static async signOut(): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
  
  // Get admin user data
  static async getAdminUser(uid: string): Promise<AdminUser | null> {
    try {
      const db = getFirebaseDb();
      if (!db) {
        console.error('Firebase database is not available');
        return null;
      }
      
      const userDoc = await getDoc(doc(db, 'admin_users', uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() } as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }
  
  // Update last login timestamp
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      if (!db) {
        console.error('Firebase database is not available');
        return;
      }
      
      const userRef = doc(db, 'admin_users', uid);
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
  
  // Monitor auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {}; // Return empty unsubscribe function if auth not available
  }
  
  // Get current user
  static getCurrentUser(): User | null {
    const auth = getFirebaseAuth();
    return auth ? auth.currentUser : null;
  }
  
  // Check if user has admin role
  static async hasAdminRole(uid: string): Promise<boolean> {
    const adminUser = await this.getAdminUser(uid);
    return adminUser !== null && adminUser.isActive;
  }
  
  // Check if user has super admin role
  static async hasSuperAdminRole(uid: string): Promise<boolean> {
    const adminUser = await this.getAdminUser(uid);
    return adminUser !== null && adminUser.role === 'super_admin' && adminUser.isActive;
  }
}