import type { FirebaseIdTokenPayload } from '../../src/core/types';

describe('Types Core Module', () => {
  describe('FirebaseIdTokenPayload interface', () => {
    it('should accept valid Firebase ID token payload', () => {
      const validPayload: FirebaseIdTokenPayload = {
        iss: 'https://securetoken.google.com/test-project',
        aud: 'test-project',
        sub: 'user123',
        user_id: 'user123',
        email: 'test@example.com',
        phone_number: '+1234567890'
      };

      expect(validPayload.iss).toBe('https://securetoken.google.com/test-project');
      expect(validPayload.aud).toBe('test-project');
      expect(validPayload.sub).toBe('user123');
      expect(validPayload.user_id).toBe('user123');
      expect(validPayload.email).toBe('test@example.com');
      expect(validPayload.phone_number).toBe('+1234567890');
    });

    it('should accept minimal payload with only required fields', () => {
      const minimalPayload: FirebaseIdTokenPayload = {};

      expect(minimalPayload).toBeDefined();
      expect(typeof minimalPayload).toBe('object');
    });

    it('should accept payload with optional fields', () => {
      const payloadWithOptionals: FirebaseIdTokenPayload = {
        iss: 'https://securetoken.google.com/test',
        aud: 'test',
        sub: 'user456'
      };

      expect(payloadWithOptionals.iss).toBe('https://securetoken.google.com/test');
      expect(payloadWithOptionals.aud).toBe('test');
      expect(payloadWithOptionals.sub).toBe('user456');
      expect(payloadWithOptionals.email).toBeUndefined();
      expect(payloadWithOptionals.phone_number).toBeUndefined();
    });

    it('should accept payload with custom claims using index signature', () => {
      const payloadWithCustomClaims: FirebaseIdTokenPayload = {
        iss: 'https://securetoken.google.com/test',
        aud: 'test',
        sub: 'user789',
        custom_claim: 'custom_value',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        metadata: {
          created_at: '2023-01-01',
          last_login: '2023-10-04'
        }
      };

      expect(payloadWithCustomClaims.custom_claim).toBe('custom_value');
      expect(payloadWithCustomClaims.role).toBe('admin');
      expect(payloadWithCustomClaims.permissions).toEqual(['read', 'write', 'delete']);
      expect(payloadWithCustomClaims.metadata).toEqual({
        created_at: '2023-01-01',
        last_login: '2023-10-04'
      });
    });

    it('should handle different data types for custom claims', () => {
      const payloadWithMixedTypes: FirebaseIdTokenPayload = {
        string_claim: 'string_value',
        number_claim: 42,
        boolean_claim: true,
        array_claim: [1, 2, 3],
        object_claim: { nested: 'value' },
        null_claim: null,
        undefined_claim: undefined
      };

      expect(typeof payloadWithMixedTypes.string_claim).toBe('string');
      expect(typeof payloadWithMixedTypes.number_claim).toBe('number');
      expect(typeof payloadWithMixedTypes.boolean_claim).toBe('boolean');
      expect(Array.isArray(payloadWithMixedTypes.array_claim)).toBe(true);
      expect(typeof payloadWithMixedTypes.object_claim).toBe('object');
      expect(payloadWithMixedTypes.null_claim).toBeNull();
      expect(payloadWithMixedTypes.undefined_claim).toBeUndefined();
    });

    it('should maintain type safety for standard Firebase fields', () => {
      const payload: FirebaseIdTokenPayload = {
        iss: 'issuer',
        aud: 'audience',
        sub: 'subject',
        user_id: 'user_123',
        email: 'user@example.com',
        phone_number: '+1234567890'
      };

      // These should all be string | undefined types
      const issuer: string | undefined = payload.iss;
      const audience: string | undefined = payload.aud;
      const subject: string | undefined = payload.sub;
      const userId: string | undefined = payload.user_id;
      const email: string | undefined = payload.email;
      const phoneNumber: string | undefined = payload.phone_number;

      expect(typeof issuer).toBe('string');
      expect(typeof audience).toBe('string');
      expect(typeof subject).toBe('string');
      expect(typeof userId).toBe('string');
      expect(typeof email).toBe('string');
      expect(typeof phoneNumber).toBe('string');
    });
  });
});