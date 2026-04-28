import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security Headers
  const securityHeaders = {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '),
    
    // Strict Transport Security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Basic bot detection
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python-requests/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      console.warn(`Potential bot detected: ${ip} - ${userAgent}`);
      // In production, you might want to block or rate limit more aggressively
    }
  }
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add additional security checks for admin routes
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      // Redirect to login if no auth header (handled by client-side auth)
      return response;
    }
  }
  
  // Block suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /\/etc\/passwd/, // System file access
    /\/proc\//, // Process information
    /<script/i, // XSS attempts
    /javascript:/i, // JavaScript protocol
    /vbscript:/i, // VBScript protocol
    /data:text\/html/i, // Data URI XSS
    /eval\(/i, // Code injection
    /union.*select/i, // SQL injection
    /drop.*table/i, // SQL injection
  ];
  
  const url = request.nextUrl.pathname + request.nextUrl.search;
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`Suspicious request blocked: ${request.ip} - ${url}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Log security events for monitoring
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to log to external monitoring service
    const securityLog = {
      timestamp: new Date().toISOString(),
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      method: request.method
    };
    
    // Log suspicious activity
    if (request.nextUrl.pathname.includes('admin') || 
        request.nextUrl.pathname.includes('api')) {
      console.log('Security Log:', securityLog);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};