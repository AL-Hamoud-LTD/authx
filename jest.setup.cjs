require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
const crypto = require('crypto');

// Global polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => crypto.randomFillSync(arr),
    subtle: {
      importKey: jest.fn(),
      verify: jest.fn(),
    }
  }
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables for Firebase
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';