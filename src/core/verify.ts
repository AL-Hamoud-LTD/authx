import { jwtVerify } from "jose";
import type { FirebaseIdTokenPayload } from "./types";
import { getGoogleJWKS } from "./jwks";

/** Verify a Firebase ID token using Google JWKS and strict issuer/audience checks. */
export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<FirebaseIdTokenPayload> {
  const JWKS = getGoogleJWKS();
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload as FirebaseIdTokenPayload;
}
