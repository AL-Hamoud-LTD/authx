# @al-hamoud/authx

Auth toolkit for Firebase  Supabase in Edge environments (Next.js friendly).

- Verify Firebase ID tokens using Google JWKS (JOSE)
- Ensure a Supabase user exists (service role admin) and tag roles/metadata
- Drop-in Next.js Edge route handler

## Install

```bash
npm install @al-hamoud/authx
```

(This package bundles `jose` and `@supabase/supabase-js` as dependencies.)

## Quick start

### Verify a Firebase ID token

```ts
import { verifyFirebaseIdToken } from '@al-hamoud/authx'

const projectId = process.env.FIREBASE_PROJECT_ID!
const payload = await verifyFirebaseIdToken(idToken, projectId)

console.log(payload.sub, payload.phone_number, payload.email)
```

### Ensure a Supabase user exists

```ts
import { makeAdminClient, ensureSupabaseUser } from '@al-hamoud/authx'

const admin = makeAdminClient({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

const user = await ensureSupabaseUser(admin, payload)
console.log('Supabase user id:', user.id)
```

### Next.js Edge route (drop-in)

```ts
// app/api/auth/verify-id-token/route.ts
export const runtime = 'edge'

import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  projectId: process.env.FIREBASE_PROJECT_ID!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

export async function POST(req: Request) {
  return handler(req)
}
```

Request contract:

- Method: POST
- Body: `{ idToken: string }`

Response (200):

```json
{
  "ok": true,
  "uid": "...",
  "phoneNumber": "+44...",
  "email": null,
  "supabaseUserId": "...",
  "note": "Verified Firebase token and ensured Supabase user exists."
}
```

## Environment variables

- `FIREBASE_PROJECT_ID` (server)
- `SUPABASE_URL` (server)
- `SUPABASE_SERVICE_ROLE_KEY` (server; keep secret)

Client Firebase config (`NEXT_PUBLIC_...`) is handled by your app’s Firebase SDK; this library validates server-side.

## Types

```ts
import type { FirebaseIdTokenPayload } from '@al-hamoud/authx'
```

## UI Component

The package also includes a React component for phone authentication:

```tsx
import { Authx } from '@al-hamoud/authx'

<Authx 
  verifyEndpoint="/api/auth/verify-id-token"
  initialCountry="GB"
/>
```

### Custom Countries Configuration

You can customize the available countries in the phone number picker:

```tsx
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// Use only specific countries
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
  AE: COUNTRIES.AE,
}

<Authx countries={customCountries} />
```

Available countries by default:

- 🇬🇧 GB: United Kingdom (+44)
- 🇺🇸 US: United States (+1)
- 🇦🇪 AE: UAE (+971)
- 🇸🇦 SA: Saudi Arabia (+966)
- 🇩🇪 DE: Germany (+49)
- 🇫🇷 FR: France (+33)

## Security notes

- JWKS validation enforces issuer and audience:
  - issuer: `https://securetoken.google.com/${projectId}`
  - audience: `projectId`
- Keep the Supabase service role key server-side only.
- Consider origin checks and rate limiting on the verify route.

---

Made for Next.js Edge. Works in standard Node runtimes as well.
