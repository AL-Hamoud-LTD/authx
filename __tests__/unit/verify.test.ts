import { verifyFirebaseIdToken } from '../../src/core/verify';
import { jwtVerify } from 'jose';
import { getGoogleJWKS } from '../../src/core/jwks';
import type { FirebaseIdTokenPayload } from '../../src/core/types';

// Mock dependencies
jest.mock('jose', () => ({
  jwtVerify: jest.fn()
}));

jest.mock('../../src/core/jwks', () => ({
  getGoogleJWKS: jest.fn()
}));

describe('Verify Core Module', () => {
  const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
  const mockGetGoogleJWKS = getGoogleJWKS as jest.MockedFunction<typeof getGoogleJWKS>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyFirebaseIdToken', () => {
    const mockToken = 'mock.jwt.token';
    const mockProjectId = 'test-project-123';
    const mockJWKS = jest.fn();
    const mockPayload: FirebaseIdTokenPayload = {
      iss: `https://securetoken.google.com/${mockProjectId}`,
      aud: mockProjectId,
      sub: 'user123',
      user_id: 'user123',
      email: 'test@example.com',
      phone_number: '+1234567890'
    };

    beforeEach(() => {
      mockGetGoogleJWKS.mockReturnValue(mockJWKS as any);
    });

    it('should verify a valid Firebase ID token', async () => {
      mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

      const result = await verifyFirebaseIdToken(mockToken, mockProjectId);

      expect(mockGetGoogleJWKS).toHaveBeenCalledTimes(1);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        mockToken,
        mockJWKS,
        {
          issuer: `https://securetoken.google.com/${mockProjectId}`,
          audience: mockProjectId
        }
      );
      expect(result).toEqual(mockPayload);
    });

    it('should use correct issuer and audience for verification', async () => {
      const customProjectId = 'custom-firebase-project';
      mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

      await verifyFirebaseIdToken(mockToken, customProjectId);

      expect(mockJwtVerify).toHaveBeenCalledWith(
        mockToken,
        mockJWKS,
        {
          issuer: `https://securetoken.google.com/${customProjectId}`,
          audience: customProjectId
        }
      );
    });

    it('should handle verification errors', async () => {
      const verificationError = new Error('Invalid token');
      mockJwtVerify.mockRejectedValue(verificationError);

      await expect(verifyFirebaseIdToken(mockToken, mockProjectId))
        .rejects.toThrow('Invalid token');

      expect(mockGetGoogleJWKS).toHaveBeenCalledTimes(1);
      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    });

    it('should return payload with required Firebase fields', async () => {
      const minimalPayload: FirebaseIdTokenPayload = {
        iss: `https://securetoken.google.com/${mockProjectId}`,
        aud: mockProjectId,
        sub: 'user123'
      };
      mockJwtVerify.mockResolvedValue({ payload: minimalPayload } as any);

      const result = await verifyFirebaseIdToken(mockToken, mockProjectId);

      expect(result).toEqual(minimalPayload);
      expect(result.iss).toBe(`https://securetoken.google.com/${mockProjectId}`);
      expect(result.aud).toBe(mockProjectId);
      expect(result.sub).toBe('user123');
    });

    it('should handle payload with additional custom claims', async () => {
      const payloadWithCustomClaims: FirebaseIdTokenPayload = {
        ...mockPayload,
        custom_claim: 'custom_value',
        role: 'admin',
        permissions: ['read', 'write']
      };
      mockJwtVerify.mockResolvedValue({ payload: payloadWithCustomClaims } as any);

      const result = await verifyFirebaseIdToken(mockToken, mockProjectId);

      expect(result).toEqual(payloadWithCustomClaims);
      expect(result.custom_claim).toBe('custom_value');
      expect(result.role).toBe('admin');
      expect(result.permissions).toEqual(['read', 'write']);
    });
  });
});