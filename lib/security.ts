/**
 * Security Utilities and Protection Measures
 * 
 * This module provides comprehensive security features including:
 * - Input sanitization and validation
 * - XSS protection
 * - CSRF protection
 * - Rate limiting
 * - Security headers
 * - Audit logging
 */

import { doc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface SecurityEvent {
  type: 'login_attempt' | 'suspicious_activity' | 'data_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
}

export class SecurityService {
  
  // Input Sanitization
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>\"'%;()&+\x00-\x1f\x7f-\x9f]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .substring(0, maxLength);
  }
  
  // HTML Encoding for XSS Prevention
  static encodeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  // SQL Injection Prevention (for any future SQL usage)
  static escapeSQLString(input: string): string {
    return input.replace(/'/g, "''").replace(/;/g, '');
  }
  
  // Email Validation with Security Checks
  static validateEmail(email: string): { valid: boolean; reason?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'Email is required' };
    }
    
    // Length check
    if (email.length > 254) {
      return { valid: false, reason: 'Email too long' };
    }
    
    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /vbscript/i,
      /onload/i,
      /onerror/i,
      /<.*>/,
      /\.\./,
      /[<>\"'%;()&+]/
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        return { valid: false, reason: 'Email contains suspicious characters' };
      }
    }
    
    return { valid: true };
  }
  
  // Password Strength Validation
  static validatePasswordStrength(password: string): { 
    score: number; 
    feedback: string[]; 
    isStrong: boolean 
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (!password) {
      return { score: 0, feedback: ['Password is required'], isStrong: false };
    }
    
    // Length check
    if (password.length >= 8) score += 25;
    else feedback.push('Use at least 8 characters');
    
    if (password.length >= 12) score += 10;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 15;
    else feedback.push('Include numbers');
    
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
    else feedback.push('Include special characters');
    
    // Common password checks
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'password123'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 30;
      feedback.push('Avoid common passwords');
    }
    
    // Sequential characters
    if (/123|abc|qwe/i.test(password)) {
      score -= 10;
      feedback.push('Avoid sequential characters');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      feedback,
      isStrong: score >= 80 && feedback.length === 0
    };
  }
  
  // Rate Limiting
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  static checkRateLimit(
    identifier: string, 
    maxRequests: number = 10, 
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    let record = this.rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      this.rateLimitMap.set(key, record);
    }
    
    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    record.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime
    };
  }
  
  // CSRF Token Generation and Validation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    return token === expectedToken;
  }
  
  // Security Event Logging
  static async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString()
      };
      
      // Sanitize event data
      if (securityEvent.email) {
        securityEvent.email = this.sanitizeInput(securityEvent.email, 100);
      }
      
      if (securityEvent.userAgent) {
        securityEvent.userAgent = this.sanitizeInput(securityEvent.userAgent, 500);
      }
      
      // Store in Firestore
      const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'security_events', eventId), securityEvent);
      
      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Event:', securityEvent);
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  // Suspicious Activity Detection
  static detectSuspiciousActivity(
    userAgent: string,
    ipAddress?: string,
    requestPattern?: string[]
  ): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check for bot-like user agents
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      reasons.push('Bot-like user agent detected');
    }
    
    // Check for suspicious user agent patterns
    if (userAgent.length < 10 || userAgent.length > 1000) {
      reasons.push('Unusual user agent length');
    }
    
    // Check for rapid requests (if pattern provided)
    if (requestPattern && requestPattern.length > 10) {
      const timeSpan = new Date(requestPattern[requestPattern.length - 1]).getTime() - 
                      new Date(requestPattern[0]).getTime();
      if (timeSpan < 60000) { // 10+ requests in 1 minute
        reasons.push('Rapid request pattern detected');
      }
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }
  
  // Get Security Events for Monitoring
  static async getSecurityEvents(
    severity?: SecurityEvent['severity'],
    limit_count: number = 100
  ): Promise<SecurityEvent[]> {
    try {
      let q = query(
        collection(db, 'security_events'),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );
      
      if (severity) {
        q = query(
          collection(db, 'security_events'),
          where('severity', '==', severity),
          orderBy('timestamp', 'desc'),
          limit(limit_count)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as SecurityEvent);
      
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }
  
  // Content Security Policy Headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
        "frame-ancestors 'none'"
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
  
  // Validate File Upload Security
  static validateFileUpload(file: File): { valid: boolean; reason?: string } {
    // File size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, reason: 'File too large (max 10MB)' };
    }
    
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, reason: 'File type not allowed' };
    }
    
    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i,
      /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.js$/i,
      /\.\./,  // Directory traversal
      /[<>:"|?*]/  // Invalid filename characters
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return { valid: false, reason: 'Suspicious file name' };
    }
    
    return { valid: true };
  }
  
  // Generate Secure Random String
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
}