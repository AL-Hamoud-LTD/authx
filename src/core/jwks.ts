import { createRemoteJWKSet } from "jose/jwks/remote";
import type { JWTVerifyGetKey } from "jose";

export const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export type RemoteJWKSet = JWTVerifyGetKey;

export function getGoogleJWKS(): RemoteJWKSet {
  return createRemoteJWKSet(new URL(JWKS_URL));
}
