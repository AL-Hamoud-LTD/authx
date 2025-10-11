export { verifyFirebaseIdToken } from './core/verify';
export type { FirebaseIdTokenPayload } from './core/types';
export { JWKS_URL, getGoogleJWKS } from './core/jwks';

export { makeAdminClient } from './supabase/client';
export type { SupabaseAdminClient, SupabaseConfig } from './supabase/client';
export { ensureSupabaseUser } from './supabase/ensureUser';

export { buildVerifyRouteHandler } from './next/edge/handler';
export type { VerifyRouteOptions } from './next/edge/handler';

export { getEnv } from './utils/env';
export { default as Authx } from './ui/Authx';

// Export COUNTRIES constant for custom country configurations
export { COUNTRIES } from './ui/Authx';

export const version = '1.3.5';
