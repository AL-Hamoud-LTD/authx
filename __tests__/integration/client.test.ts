import { makeAdminClient } from '../../src/supabase/client';

// Mock the Supabase library
const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args)
}));

describe('Supabase Client Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('makeAdminClient', () => {
    it('should create admin client with correct configuration', () => {
      const config = {
        url: 'https://test-project.supabase.co',
        serviceRoleKey: 'test-service-role-key'
      };

      const mockClient = {
        auth: {
          admin: {
            listUsers: jest.fn(),
            createUser: jest.fn()
          }
        }
      };

      mockCreateClient.mockReturnValue(mockClient);

      const result = makeAdminClient(config);

      expect(mockCreateClient).toHaveBeenCalledWith(
        config.url,
        config.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      expect(result).toBe(mockClient);
    });

    it('should return client with admin auth capabilities', () => {
      const config = {
        url: 'https://another-project.supabase.co',
        serviceRoleKey: 'another-service-role-key'
      };

      const mockClient = {
        auth: {
          admin: {
            listUsers: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn()
          }
        },
        from: jest.fn(),
        rpc: jest.fn()
      };

      mockCreateClient.mockReturnValue(mockClient);

      const result = makeAdminClient(config);

      expect(result).toHaveProperty('auth.admin');
      expect(typeof result.auth.admin.listUsers).toBe('function');
      expect(typeof result.auth.admin.createUser).toBe('function');
    });

    it('should configure client for server-side usage', () => {
      const config = {
        url: 'https://server-project.supabase.co',
        serviceRoleKey: 'server-service-role-key'
      };

      makeAdminClient(config);

      const [url, key, options] = mockCreateClient.mock.calls[0];
      
      expect(url).toBe(config.url);
      expect(key).toBe(config.serviceRoleKey);
      expect(options.auth.autoRefreshToken).toBe(false);
      expect(options.auth.persistSession).toBe(false);
    });

    it('should handle different URL formats', () => {
      const configs = [
        { url: 'https://abc.supabase.co', serviceRoleKey: 'key1' },
        { url: 'https://xyz.supabase.io', serviceRoleKey: 'key2' },
        { url: 'https://custom-domain.com', serviceRoleKey: 'key3' }
      ];

      configs.forEach(config => {
        makeAdminClient(config);
        
        expect(mockCreateClient).toHaveBeenCalledWith(
          config.url,
          config.serviceRoleKey,
          expect.any(Object)
        );
      });
    });

    it('should work with environment-based configuration', () => {
      // Simulate real environment variables
      const envConfig = {
        url: process.env.SUPABASE_URL || 'https://test.supabase.co',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
      };

      const mockClient = { auth: { admin: {} } };
      mockCreateClient.mockReturnValue(mockClient);

      const result = makeAdminClient(envConfig);

      expect(mockCreateClient).toHaveBeenCalledWith(
        envConfig.url,
        envConfig.serviceRoleKey,
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      );
      expect(result).toBe(mockClient);
    });
  });

  describe('Client Configuration', () => {
    it('should disable auto refresh and session persistence', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key'
      };

      makeAdminClient(config);

      const options = mockCreateClient.mock.calls[0][2];
      
      expect(options.auth.autoRefreshToken).toBe(false);
      expect(options.auth.persistSession).toBe(false);
    });

    it('should be suitable for server-side operations', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key'
      };

      makeAdminClient(config);

      const [, serviceRoleKey, options] = mockCreateClient.mock.calls[0];
      
      // Should use service role key (has admin privileges)
      expect(serviceRoleKey).toBe(config.serviceRoleKey);
      
      // Should not persist sessions (server-side)
      expect(options.auth.persistSession).toBe(false);
      
      // Should not auto-refresh tokens (server-side)
      expect(options.auth.autoRefreshToken).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed client', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key'
      };

      const mockClient = {
        auth: {
          admin: {
            listUsers: jest.fn(),
            createUser: jest.fn()
          }
        }
      };

      mockCreateClient.mockReturnValue(mockClient);

      const client = makeAdminClient(config);

      // TypeScript should infer the correct type
      expect(client).toHaveProperty('auth');
      expect(client.auth).toHaveProperty('admin');
    });
  });
});