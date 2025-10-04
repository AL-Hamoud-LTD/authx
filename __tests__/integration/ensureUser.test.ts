import { ensureSupabaseUser } from '../../src/supabase/ensureUser';
import type { FirebaseIdTokenPayload } from '../../src/core/types';

describe('Supabase ensureUser Integration', () => {
  const mockAdminClient = {
    auth: {
      admin: {
        listUsers: jest.fn(),
        createUser: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureSupabaseUser', () => {
    it('should throw error when subject is missing', async () => {
      const claims: FirebaseIdTokenPayload = {
        phone_number: '+1234567890'
        // Missing sub and user_id
      };

      await expect(ensureSupabaseUser(mockAdminClient as any, claims))
        .rejects.toThrow('Missing subject in token');
    });

    it('should find existing user by phone number', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890'
      };

      const existingUser = {
        id: 'existing-user-id',
        phone: '+1234567890'
      };

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [existingUser, { id: 'other-user', phone: '+9876543210' }]
        }
      });

      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: existingUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(existingUser);
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalledWith();
      expect(mockAdminClient.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('should find existing user by email when phone not found', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890',
        email: 'test@example.com'
      };

      const existingUserByEmail = {
        id: 'existing-user-id',
        email: 'test@example.com'
      };

      // First call (phone search) returns no matches
      mockAdminClient.auth.admin.listUsers
        .mockResolvedValueOnce({
          data: {
            users: [{ id: 'other-user', phone: '+9876543210' }]
          }
        })
        // Second call (email search) returns match
        .mockResolvedValueOnce({
          data: {
            users: [existingUserByEmail, { id: 'other-user', email: 'other@example.com' }]
          }
        });

      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: existingUserByEmail },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(existingUserByEmail);
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalledTimes(2);
      expect(mockAdminClient.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive email matching', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890',
        email: 'Test@Example.COM'
      };

      const existingUserByEmail = {
        id: 'existing-user-id',
        email: 'test@example.com'
      };

      mockAdminClient.auth.admin.listUsers
        .mockResolvedValueOnce({
          data: { users: [] } // No phone matches
        })
        .mockResolvedValueOnce({
          data: {
            users: [existingUserByEmail]
          }
        });

      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: existingUserByEmail },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(existingUserByEmail);
    });

    it('should create new user when none exists', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890',
        email: 'test@example.com'
      };

      const newUser = {
        id: 'new-user-id',
        phone: '+1234567890',
        email: 'test@example.com'
      };

      // No existing users found
      mockAdminClient.auth.admin.listUsers
        .mockResolvedValueOnce({ data: { users: [] } })
        .mockResolvedValueOnce({ data: { users: [] } });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(newUser);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        phone: '+1234567890',
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { 
          firebase_uid: 'firebase-user-123', 
          provider: 'firebase-phone' 
        },
        app_metadata: { roles: ['authenticated'] }
      });
    });

    it('should create user with phone only when email is missing', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890'
        // No email
      };

      const newUser = { id: 'new-user-id' };

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }
      });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(newUser);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: undefined,
        phone: '+1234567890',
        email_confirm: false,
        phone_confirm: true,
        user_metadata: { 
          firebase_uid: 'firebase-user-123', 
          provider: 'firebase-phone' 
        },
        app_metadata: { roles: ['authenticated'] }
      });
    });

    it('should create user with email only when phone is missing', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        email: 'test@example.com'
        // No phone
      };

      const newUser = { id: 'new-user-id' };

      // Only email search will be performed
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }
      });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(newUser);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        phone: undefined,
        email_confirm: true,
        phone_confirm: false,
        user_metadata: { 
          firebase_uid: 'firebase-user-123', 
          provider: 'firebase-phone' 
        },
        app_metadata: { roles: ['authenticated'] }
      });
    });

    it('should handle user_id instead of sub', async () => {
      const claims: FirebaseIdTokenPayload = {
        user_id: 'firebase-user-456', // Using user_id instead of sub
        phone_number: '+1234567890'
      };

      const newUser = { id: 'new-user-id' };

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }
      });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      expect(result).toBe(newUser);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: { 
            firebase_uid: 'firebase-user-456', 
            provider: 'firebase-phone' 
          }
        })
      );
    });

    it('should handle Supabase createUser errors', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        phone_number: '+1234567890'
      };

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }
      });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User creation failed' }
      });

      await expect(ensureSupabaseUser(mockAdminClient as any, claims))
        .rejects.toThrow('Failed to create user');
    });

    it('should handle users with missing email field gracefully', async () => {
      const claims: FirebaseIdTokenPayload = {
        sub: 'firebase-user-123',
        email: 'test@example.com'
      };

      // Mock user without email field
      const userWithoutEmail = {
        id: 'user-without-email'
        // No email field
      };

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [userWithoutEmail]
        }
      });

      const newUser = { id: 'new-user-id' };
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const result = await ensureSupabaseUser(mockAdminClient as any, claims);

      // Should create new user since existing user doesn't match email
      expect(result).toBe(newUser);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalled();
    });
  });
});