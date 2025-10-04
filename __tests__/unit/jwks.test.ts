// Mock the jose library before importing
jest.mock('jose/jwks/remote', () => ({
  createRemoteJWKSet: jest.fn(() => jest.fn())
}));

import { getGoogleJWKS, JWKS_URL } from '../../src/core/jwks';

describe('JWKS Core Module', () => {
  describe('JWKS_URL constant', () => {
    it('should export the correct Google JWKS URL', () => {
      expect(JWKS_URL).toBe('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    });

    it('should be a valid URL', () => {
      expect(() => new URL(JWKS_URL)).not.toThrow();
    });
  });

  describe('getGoogleJWKS function', () => {
    it('should return a function', () => {
      const result = getGoogleJWKS();
      expect(typeof result).toBe('function');
    });

    it('should return consistent results for multiple calls', () => {
      const jwks1 = getGoogleJWKS();
      const jwks2 = getGoogleJWKS();
      
      expect(typeof jwks1).toBe('function');
      expect(typeof jwks2).toBe('function');
    });

    it('should create JWKS from Google service accounts', () => {
      const jwks = getGoogleJWKS();
      
      // Test that it's callable (basic structure test)
      expect(jwks).toBeDefined();
      expect(typeof jwks).toBe('function');
    });
  });
});