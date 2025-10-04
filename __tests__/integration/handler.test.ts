// Mock the jose library before any imports
jest.mock('jose', () => ({
  jwtVerify: jest.fn()
}));

jest.mock('jose/jwks/remote', () => ({
  createRemoteJWKSet: jest.fn(() => jest.fn())
}));

import { buildVerifyRouteHandler } from '../../src/next/edge/handler';
import { verifyFirebaseIdToken } from '../../src/core/verify';
import { makeAdminClient } from '../../src/supabase/client';
import { ensureSupabaseUser } from '../../src/supabase/ensureUser';

// Mock dependencies
jest.mock('../../src/core/verify');
jest.mock('../../src/supabase/client');
jest.mock('../../src/supabase/ensureUser');

describe('Next.js Edge Handler Integration', () => {
  const mockVerifyFirebaseIdToken = verifyFirebaseIdToken as jest.MockedFunction<typeof verifyFirebaseIdToken>;
  const mockMakeAdminClient = makeAdminClient as jest.MockedFunction<typeof makeAdminClient>;
  const mockEnsureSupabaseUser = ensureSupabaseUser as jest.MockedFunction<typeof ensureSupabaseUser>;

  const mockOptions = {
    projectId: 'test-project',
    supabaseUrl: 'https://test.supabase.co',
    supabaseServiceRoleKey: 'test-service-role-key'
  };

  const mockAdminClient = {
    auth: {
      admin: {
        listUsers: jest.fn(),
        createUser: jest.fn()
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMakeAdminClient.mockReturnValue(mockAdminClient as any);
    
    // Mock Response constructor for edge runtime
    (globalThis as any).Response = jest.fn().mockImplementation((body, init) => ({
      body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {}))
    }));
  });

  describe('buildVerifyRouteHandler', () => {
    it('should create a handler function', () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      
      expect(typeof handler).toBe('function');
      expect(mockMakeAdminClient).toHaveBeenCalledWith({
        url: mockOptions.supabaseUrl,
        serviceRoleKey: mockOptions.supabaseServiceRoleKey
      });
    });

    it('should reject requests with invalid content type', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        }
      };

      const response = await handler(mockRequest);

      expect(response.status).toBe(415);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Unsupported content type'
      });
    });

    it('should reject requests with invalid payload', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ idToken: 'short' })
      };

      const response = await handler(mockRequest);

      expect(response.status).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Invalid payload'
      });
    });

    it('should reject requests with malformed JSON', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      const response = await handler(mockRequest);

      expect(response.status).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Invalid payload'
      });
    });

    it('should reject invalid Firebase ID tokens', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({
          idToken: 'a'.repeat(101) // Valid length but invalid token
        })
      };

      mockVerifyFirebaseIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await handler(mockRequest);

      expect(response.status).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Invalid or expired Firebase ID token'
      });
    });

    it('should successfully verify valid token and ensure user', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockIdToken = 'a'.repeat(101);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ idToken: mockIdToken })
      };

      const mockPayload = {
        sub: 'firebase-user-123',
        user_id: 'firebase-user-123',
        phone_number: '+1234567890',
        email: 'test@example.com'
      };

      const mockSupabaseUser = {
        id: 'supabase-user-456'
      };

      mockVerifyFirebaseIdToken.mockResolvedValue(mockPayload);
      mockEnsureSupabaseUser.mockResolvedValue(mockSupabaseUser);

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        ok: true,
        uid: 'firebase-user-123',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        supabaseUserId: 'supabase-user-456',
        note: 'Verified Firebase token and ensured Supabase user exists.'
      });

      expect(mockVerifyFirebaseIdToken).toHaveBeenCalledWith(mockIdToken, mockOptions.projectId);
      expect(mockEnsureSupabaseUser).toHaveBeenCalledWith(mockAdminClient, mockPayload);
    });

    it('should handle missing user_id gracefully', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ idToken: 'a'.repeat(101) })
      };

      const mockPayload = {
        phone_number: '+1234567890',
        email: 'test@example.com'
        // Missing sub and user_id
      };

      const mockSupabaseUser = { id: 'supabase-user-456' };

      mockVerifyFirebaseIdToken.mockResolvedValue(mockPayload);
      mockEnsureSupabaseUser.mockResolvedValue(mockSupabaseUser);

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        ok: true,
        uid: null,
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        supabaseUserId: 'supabase-user-456',
        note: 'Verified Firebase token and ensured Supabase user exists.'
      });
    });

    it('should handle internal errors gracefully', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ idToken: 'a'.repeat(101) })
      };

      mockVerifyFirebaseIdToken.mockRejectedValue(new Error('Unexpected error'));

      const response = await handler(mockRequest);

      expect(response.status).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Invalid or expired Firebase ID token'
      });
    });

    it('should handle Supabase errors gracefully', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ idToken: 'a'.repeat(101) })
      };

      const mockPayload = { sub: 'test-user' };

      mockVerifyFirebaseIdToken.mockResolvedValue(mockPayload);
      mockEnsureSupabaseUser.mockRejectedValue(new Error('Supabase error'));

      const response = await handler(mockRequest);

      expect(response.status).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        ok: false,
        error: 'Internal error'
      });
    });
  });

  describe('Response Helper', () => {
    it('should create proper JSON responses', async () => {
      const handler = buildVerifyRouteHandler(mockOptions);
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        }
      };

      const response = await handler(mockRequest);

      expect(response).toHaveProperty('status', 415);
      expect(response).toHaveProperty('body');
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('cache-control')).toBe('no-store');
    });
  });
});