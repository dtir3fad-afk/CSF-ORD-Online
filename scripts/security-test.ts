/**
 * Security Testing Script
 * 
 * This script tests various security measures and validates the system's
 * protection against common attacks.
 */

import { SecurityService } from '../lib/security';

function testInputSanitization() {
  console.log('🧪 Testing Input Sanitization...');
  
  const testCases = [
    {
      input: '<script>alert("xss")</script>',
      expected: 'scriptalert("xss")/script'
    },
    {
      input: 'javascript:alert(1)',
      expected: 'alert(1)'
    },
    {
      input: 'SELECT * FROM users; DROP TABLE users;',
      expected: 'SELECT * FROM users DROP TABLE users'
    },
    {
      input: '../../etc/passwd',
      expected: '../../etc/passwd'
    },
    {
      input: 'normal@email.com',
      expected: 'normal@email.com'
    }
  ];
  
  let passed = 0;
  
  testCases.forEach((test, index) => {
    const result = SecurityService.sanitizeInput(test.input);
    const success = result === test.expected;
    
    console.log(`  Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`    Input: "${test.input}"`);
    console.log(`    Expected: "${test.expected}"`);
    console.log(`    Got: "${result}"`);
    
    if (success) passed++;
  });
  
  console.log(`  Result: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

function testEmailValidation() {
  console.log('📧 Testing Email Validation...');
  
  const testCases = [
    { email: 'valid@example.com', shouldPass: true },
    { email: 'user.name+tag@domain.co.uk', shouldPass: true },
    { email: 'invalid.email', shouldPass: false },
    { email: 'test@', shouldPass: false },
    { email: '@domain.com', shouldPass: false },
    { email: 'test<script>@domain.com', shouldPass: false },
    { email: 'test@domain..com', shouldPass: false },
    { email: '', shouldPass: false },
    { email: 'a'.repeat(255) + '@domain.com', shouldPass: false }
  ];
  
  let passed = 0;
  
  testCases.forEach((test, index) => {
    const result = SecurityService.validateEmail(test.email);
    const success = result.valid === test.shouldPass;
    
    console.log(`  Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`    Email: "${test.email}"`);
    console.log(`    Expected: ${test.shouldPass ? 'Valid' : 'Invalid'}`);
    console.log(`    Got: ${result.valid ? 'Valid' : 'Invalid'} ${result.reason ? `(${result.reason})` : ''}`);
    
    if (success) passed++;
  });
  
  console.log(`  Result: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

function testPasswordStrength() {
  console.log('🔐 Testing Password Strength...');
  
  const testCases = [
    { password: 'WeakPass1!', expectedStrong: true },
    { password: 'VeryStr0ng!P@ssw0rd', expectedStrong: true },
    { password: 'weak', expectedStrong: false },
    { password: '12345678', expectedStrong: false },
    { password: 'password123', expectedStrong: false },
    { password: 'ALLUPPERCASE123!', expectedStrong: false },
    { password: 'alllowercase123!', expectedStrong: false },
    { password: 'NoNumbers!', expectedStrong: false }
  ];
  
  let passed = 0;
  
  testCases.forEach((test, index) => {
    const result = SecurityService.validatePasswordStrength(test.password);
    const success = result.isStrong === test.expectedStrong;
    
    console.log(`  Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`    Password: "${test.password}"`);
    console.log(`    Expected: ${test.expectedStrong ? 'Strong' : 'Weak'}`);
    console.log(`    Got: ${result.isStrong ? 'Strong' : 'Weak'} (Score: ${result.score})`);
    if (result.feedback.length > 0) {
      console.log(`    Feedback: ${result.feedback.join(', ')}`);
    }
    
    if (success) passed++;
  });
  
  console.log(`  Result: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

function testRateLimiting() {
  console.log('⏱️  Testing Rate Limiting...');
  
  const identifier = 'test-user';
  const maxRequests = 5;
  const windowMs = 60000;
  
  let passed = 0;
  const totalTests = 7;
  
  // Test normal requests within limit
  for (let i = 1; i <= maxRequests; i++) {
    const result = SecurityService.checkRateLimit(identifier, maxRequests, windowMs);
    if (result.allowed && result.remaining === maxRequests - i) {
      passed++;
      console.log(`  ✅ Request ${i}: Allowed (${result.remaining} remaining)`);
    } else {
      console.log(`  ❌ Request ${i}: Should be allowed but got blocked`);
    }
  }
  
  // Test request over limit
  const overLimitResult = SecurityService.checkRateLimit(identifier, maxRequests, windowMs);
  if (!overLimitResult.allowed) {
    passed++;
    console.log(`  ✅ Over-limit request: Correctly blocked`);
  } else {
    console.log(`  ❌ Over-limit request: Should be blocked but was allowed`);
  }
  
  // Test different identifier (should be allowed)
  const differentUserResult = SecurityService.checkRateLimit('different-user', maxRequests, windowMs);
  if (differentUserResult.allowed) {
    passed++;
    console.log(`  ✅ Different user: Correctly allowed`);
  } else {
    console.log(`  ❌ Different user: Should be allowed but was blocked`);
  }
  
  console.log(`  Result: ${passed}/${totalTests} tests passed\n`);
  return passed === totalTests;
}

function testSuspiciousActivityDetection() {
  console.log('🕵️  Testing Suspicious Activity Detection...');
  
  const testCases = [
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      expected: false,
      description: 'Normal browser'
    },
    {
      userAgent: 'curl/7.68.0',
      expected: true,
      description: 'cURL bot'
    },
    {
      userAgent: 'python-requests/2.25.1',
      expected: true,
      description: 'Python bot'
    },
    {
      userAgent: 'Googlebot/2.1',
      expected: true,
      description: 'Search engine bot'
    },
    {
      userAgent: 'x',
      expected: true,
      description: 'Suspiciously short user agent'
    }
  ];
  
  let passed = 0;
  
  testCases.forEach((test, index) => {
    const result = SecurityService.detectSuspiciousActivity(test.userAgent);
    const success = result.suspicious === test.expected;
    
    console.log(`  Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`    ${test.description}`);
    console.log(`    Expected: ${test.expected ? 'Suspicious' : 'Normal'}`);
    console.log(`    Got: ${result.suspicious ? 'Suspicious' : 'Normal'}`);
    if (result.reasons.length > 0) {
      console.log(`    Reasons: ${result.reasons.join(', ')}`);
    }
    
    if (success) passed++;
  });
  
  console.log(`  Result: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

function testCSRFProtection() {
  console.log('🛡️  Testing CSRF Protection...');
  
  let passed = 0;
  const totalTests = 3;
  
  // Test token generation
  const token1 = SecurityService.generateCSRFToken();
  const token2 = SecurityService.generateCSRFToken();
  
  if (token1 !== token2 && token1.length === 64 && token2.length === 64) {
    passed++;
    console.log('  ✅ Token generation: Unique tokens created');
  } else {
    console.log('  ❌ Token generation: Tokens not unique or wrong length');
  }
  
  // Test valid token validation
  if (SecurityService.validateCSRFToken(token1, token1)) {
    passed++;
    console.log('  ✅ Valid token: Correctly validated');
  } else {
    console.log('  ❌ Valid token: Should validate but failed');
  }
  
  // Test invalid token validation
  if (!SecurityService.validateCSRFToken(token1, token2)) {
    passed++;
    console.log('  ✅ Invalid token: Correctly rejected');
  } else {
    console.log('  ❌ Invalid token: Should reject but accepted');
  }
  
  console.log(`  Result: ${passed}/${totalTests} tests passed\n`);
  return passed === totalTests;
}

async function runSecurityTests() {
  console.log('🔒 DTI CSF Security Test Suite');
  console.log('==============================\n');
  
  const tests = [
    { name: 'Input Sanitization', test: testInputSanitization },
    { name: 'Email Validation', test: testEmailValidation },
    { name: 'Password Strength', test: testPasswordStrength },
    { name: 'Rate Limiting', test: testRateLimiting },
    { name: 'Suspicious Activity Detection', test: testSuspiciousActivityDetection },
    { name: 'CSRF Protection', test: testCSRFProtection }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const passed = test();
      results.push({ name, passed, error: null });
    } catch (error) {
      console.log(`❌ ${name}: Test failed with error`);
      console.log(`   Error: ${error}`);
      results.push({ name, passed: false, error: error });
    }
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`        Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All security tests passed! Your system is well protected.');
  } else {
    console.log('⚠️  Some security tests failed. Please review and fix the issues.');
  }
  
  console.log('\n🔐 Security Recommendations:');
  console.log('• Regularly run these security tests');
  console.log('• Monitor security logs for suspicious activity');
  console.log('• Keep dependencies updated');
  console.log('• Use HTTPS in production');
  console.log('• Enable Firebase App Check for additional protection');
  console.log('• Set up monitoring and alerting for security events');
  
  return passedTests === totalTests;
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests()
    .then((allPassed) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Security test suite failed:', error);
      process.exit(1);
    });
}

export { runSecurityTests };