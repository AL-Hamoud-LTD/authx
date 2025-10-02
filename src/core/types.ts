export interface FirebaseIdTokenPayload {
  iss?: string;
  aud?: string;
  sub?: string;
  user_id?: string;
  email?: string;
  phone_number?: string;
  [key: string]: unknown;
}
