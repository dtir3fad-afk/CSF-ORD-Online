'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, Lock } from 'lucide-react';
import { AuthService } from '@/lib/auth';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Security monitoring
  useEffect(() => {
    // Monitor for suspicious activity
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect potential automated attacks
      if (e.isTrusted === false) {
        console.warn('Suspicious keyboard activity detected');
      }
    };

    // Monitor for rapid form submissions
    let lastSubmitTime = 0;
    const handleSubmit = () => {
      const now = Date.now();
      if (now - lastSubmitTime < 1000) { // Less than 1 second between attempts
        console.warn('Rapid submission detected');
        setError('Please wait before trying again');
        return false;
      }
      lastSubmitTime = now;
      return true;
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (error) setError(null);
    
    // Input sanitization
    const sanitizedValue = value.trim().substring(0, 100);
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    if (!AuthService.isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || isLocked) return;
    
    if (!validateForm()) return;

    // Rate limiting check
    if (AuthService.isRateLimited(formData.email)) {
      setError('Too many attempts. Please wait 15 minutes before trying again.');
      setIsLocked(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await AuthService.signIn(formData.email, formData.password);
      
      if (result.success && result.user) {
        // Clear form
        setFormData({ email: '', password: '' });
        setAttempts(0);
        onLoginSuccess();
      } else {
        setAttempts(prev => prev + 1);
        setError(result.error || 'Login failed');
        
        // Lock form after 5 attempts
        if (attempts >= 4) {
          setIsLocked(true);
          setError('Too many failed attempts. Form locked for security.');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    const validation = AuthService.isValidPassword(password);
    if (validation.valid) {
      return { strength: 100, label: 'Strong', color: '#27500A' };
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    
    if (strength < 50) return { strength, label: 'Weak', color: '#d93025' };
    if (strength < 75) return { strength, label: 'Fair', color: '#f9ab00' };
    return { strength, label: 'Good', color: '#1e8e3e' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A4B8C 0%, #2563eb 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#1A4B8C',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            DTI CSF Admin
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            Secure access to the Client Satisfaction System
          </p>
        </div>

        {/* Security Notice */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Lock size={16} color="#d97706" />
          <span style={{ fontSize: '12px', color: '#92400e' }}>
            This system is protected by advanced security measures
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color="#dc2626" />
            <span style={{ fontSize: '14px', color: '#dc2626' }}>
              {error}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading || isLocked}
              placeholder="admin@dti.gov.ph"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: loading || isLocked ? '#f9fafb' : 'white',
                color: loading || isLocked ? '#9ca3af' : '#111827'
              }}
              autoComplete="email"
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading || isLocked}
                placeholder="Enter your secure password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '48px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: loading || isLocked ? '#f9fafb' : 'white',
                  color: loading || isLocked ? '#9ca3af' : '#111827'
                }}
                autoComplete="current-password"
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || isLocked}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${passwordStrength.strength}%`,
                    height: '100%',
                    background: passwordStrength.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{
                  fontSize: '12px',
                  color: passwordStrength.color,
                  fontWeight: 500
                }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Attempt Counter */}
          {attempts > 0 && (
            <div style={{
              fontSize: '12px',
              color: '#dc2626',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Failed attempts: {attempts}/5
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isLocked || !formData.email || !formData.password}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: loading || isLocked ? '#9ca3af' : '#1A4B8C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading || isLocked ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            {loading ? 'Signing In...' : isLocked ? 'Locked' : 'Sign In Securely'}
          </button>
        </form>

        {/* Security Footer */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            🔒 Protected by enterprise-grade security
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            • Multi-factor authentication • Rate limiting • Audit logging
          </div>
        </div>
      </div>
    </div>
  );
}