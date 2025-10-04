# @al-hamoud/authx Multi-Tenant Guide

## 🏢 Company Isolation Architecture

This guide explains how to implement `@al-hamoud/authx` in a multi-tenant environment where multiple companies need complete data isolation.

## Architecture Overview

### Perfect Isolation Model

```
Company A                    Company B                    Company C
├── Firebase Project A       ├── Firebase Project B       ├── Firebase Project C
├── Supabase Instance A      ├── Supabase Instance B      ├── Supabase Instance C
├── Next.js App A           ├── Next.js App B           ├── Next.js App C
└── @al-hamoud/authx        └── @al-hamoud/authx        └── @al-hamoud/authx
```

**Key Benefits:**
- ✅ **Zero data sharing** between companies
- ✅ **Independent scaling** and configuration
- ✅ **Company-specific SMS branding** (Firebase sender)
- ✅ **Separate billing** and quotas
- ✅ **Individual security policies**

## Step-by-Step Implementation

### Step 1: Per-Company Firebase Setup

Each company must create their own Firebase project:

#### Company A Setup
```bash
# Company A Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCompanyA...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=company-a-auth.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=company-a-auth
```

#### Company B Setup
```bash
# Company B Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCompanyB...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=company-b-auth.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=company-b-auth
```

**Important**: Each company gets their own:
- SMS sender identity
- reCAPTCHA configuration
- Usage quotas and billing
- Security rules and policies

### Step 2: Per-Company Supabase Setup

Each company must create their own Supabase instance:

#### Company A Environment
```bash
# Company A Supabase Configuration
SUPABASE_URL=https://company-a-xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CompanyA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CompanyA
```

#### Company B Environment
```bash
# Company B Supabase Configuration
SUPABASE_URL=https://company-b-abc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CompanyB
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CompanyB
```

### Step 3: Shared Library Implementation

All companies use the same `@al-hamoud/authx` library with their own credentials:

#### Company A Implementation
```typescript
// Company A app/api/auth/verify-id-token/route.ts
export const runtime = 'edge'

import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,           // Company A Supabase
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Company A Key
})

export async function POST(req: Request) {
  return handler(req)
}
```

#### Company A Frontend
```typescript
// Company A auth component
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,     // Company A
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, // Company A
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,   // Company A
}

<Authx firebaseConfig={firebaseConfig} />
```

## Security Best Practices

### 1. Environment Variable Isolation

**❌ Never Share:**
```bash
# WRONG: Don't use shared credentials
SHARED_FIREBASE_PROJECT_ID=shared-auth-project
SHARED_SUPABASE_URL=https://shared.supabase.co
```

**✅ Company-Specific:**
```bash
# CORRECT: Each company has their own
FIREBASE_PROJECT_ID=acme-corp-auth-2024
SUPABASE_URL=https://acme-corp-xyz123.supabase.co
```

### 2. Service Role Key Security

**Critical Security Rules:**

```typescript
// ✅ Server-side only (API routes)
const handler = buildVerifyRouteHandler({
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Secret
})

// ❌ Never expose in client-side code
const badConfig = {
  serviceKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY, // WRONG!
}
```

### 3. Domain Authorization

Each company must configure their own domains:

#### Firebase Console Setup
1. Go to Authentication → Settings → Authorized domains
2. Add company-specific domains:
   - `company-a.com`
   - `app.company-a.com`
   - `localhost` (development only)

#### Supabase CORS Setup
1. Go to Settings → API → CORS
2. Add company-specific origins:
   - `https://company-a.com`
   - `https://app.company-a.com`

### 4. Rate Limiting Per Company

Implement company-specific rate limiting:

```typescript
// app/api/auth/verify-id-token/route.ts
import { buildVerifyRouteHandler } from '@al-hamoud/authx'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Company A limit
})

export async function POST(req: Request) {
  // Apply company-specific rate limiting
  try {
    await limiter.check(10, 'COMPANY_A_AUTH') // 10 requests per minute
  } catch {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  const handler = buildVerifyRouteHandler({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  })

  return handler(req)
}
```

## Data Isolation Verification

### Verification Checklist

**✅ Firebase Isolation:**
- [ ] Each company has separate Firebase project
- [ ] SMS messages show correct sender identity
- [ ] Usage quotas are company-specific
- [ ] No shared authentication tokens

**✅ Supabase Isolation:**
- [ ] Each company has separate Supabase instance
- [ ] User data stored in company-specific database
- [ ] No cross-company data access possible
- [ ] Service role keys are company-specific

**✅ Application Isolation:**
- [ ] Environment variables are company-specific
- [ ] No shared configuration files
- [ ] Domain authorization configured per company
- [ ] Rate limiting applied per company

### Testing Isolation

```typescript
// Test script to verify isolation
async function testIsolation() {
  // Company A user should not exist in Company B database
  const companyAUser = await authenticateWithCompanyA('+44123456789')
  const companyBUser = await checkUserInCompanyB('+44123456789')
  
  console.assert(companyAUser.exists === true, 'Company A user should exist')
  console.assert(companyBUser.exists === false, 'Company B should not see Company A user')
}
```

## Deployment Strategies

### 1. Separate Vercel Projects (Recommended)

```bash
# Company A
vercel --prod --env FIREBASE_PROJECT_ID=company-a-auth
vercel --prod --env SUPABASE_URL=https://company-a.supabase.co

# Company B  
vercel --prod --env FIREBASE_PROJECT_ID=company-b-auth
vercel --prod --env SUPABASE_URL=https://company-b.supabase.co
```

### 2. Monorepo with Environment Branching

```
auth-platform/
├── apps/
│   ├── company-a/          # Company A app
│   ├── company-b/          # Company B app
│   └── company-c/          # Company C app
├── packages/
│   └── authx/              # Shared @al-hamoud/authx
└── shared/
    └── components/         # Shared UI components
```

### 3. White-Label Solution

```typescript
// Configurable per company
const companyConfig = {
  companyA: {
    firebase: { /* Company A config */ },
    supabase: { /* Company A config */ },
    branding: { /* Company A theme */ }
  },
  companyB: {
    firebase: { /* Company B config */ },
    supabase: { /* Company B config */ },
    branding: { /* Company B theme */ }
  }
}

// Dynamic configuration
const config = companyConfig[process.env.COMPANY_ID!]
<Authx firebaseConfig={config.firebase} theme={config.branding} />
```

## Cost Optimization

### Firebase Costs Per Company

**SMS Costs (per company):**
- Free tier: 10 SMS/day
- Paid: $0.05 per SMS (varies by country)

**Strategy**: Each company pays their own SMS costs through their Firebase billing.

### Supabase Costs Per Company

**Database Costs (per company):**
- Free tier: 500MB database
- Pro: $25/month per project

**Strategy**: Companies can choose their own Supabase tier based on usage.

### Shared Library Benefits

**Cost Savings:**
- ✅ Single `@al-hamoud/authx` package maintained
- ✅ Shared security updates and features
- ✅ Reduced development time per company
- ✅ Common testing and documentation

## Compliance and Audit

### GDPR Compliance

Each company handles their own GDPR compliance:

```typescript
// Company-specific data handling
const gdprConfig = {
  dataRetention: '2 years',        // Company policy
  rightToErasure: true,           // Delete user data
  dataPortability: true,          // Export user data
  lawfulBasis: 'legitimate_interest'
}

// Implement per company
async function handleGDPRRequest(companyId: string, userId: string, action: string) {
  const supabase = getCompanySupabase(companyId)
  // Handle company-specific GDPR requests
}
```

### Audit Logging

```typescript
// Company-specific audit logging
async function logAuthEvent(companyId: string, event: AuthEvent) {
  const supabase = getCompanySupabase(companyId)
  
  await supabase
    .from('audit_log')
    .insert({
      company_id: companyId,
      event_type: event.type,
      user_id: event.userId,
      ip_address: event.ip,
      timestamp: new Date().toISOString()
    })
}
```

## Migration Strategy

### Adding New Companies

1. **Create Infrastructure:**
   ```bash
   # New company setup script
   ./scripts/setup-company.sh COMPANY_NAME
   ```

2. **Deploy Application:**
   ```bash
   # Deploy with company-specific config
   vercel --prod --env COMPANY_ID=new-company
   ```

3. **Configure DNS:**
   ```bash
   # Point company domain to their deployment
   auth.new-company.com → vercel-deployment-url
   ```

### Existing Company Migration

```typescript
// Migration script for existing companies
async function migrateCompany(oldConfig: any, newConfig: any) {
  // 1. Create new Firebase project
  const newFirebase = await createFirebaseProject(newConfig.firebase)
  
  // 2. Create new Supabase instance  
  const newSupabase = await createSupabaseProject(newConfig.supabase)
  
  // 3. Migrate user data (if needed)
  // Note: Phone auth doesn't require user migration
  
  // 4. Update environment variables
  await updateEnvironmentVariables(newConfig.env)
  
  // 5. Test authentication flow
  await testAuthenticationFlow(newConfig)
}
```

## Common Pitfalls

### ❌ Sharing Firebase Projects

**Problem**: Multiple companies using same Firebase project
**Issue**: SMS branding confusion, shared quotas, security risks
**Solution**: One Firebase project per company

### ❌ Shared Supabase Service Keys

**Problem**: Using same service role key across companies
**Issue**: Cross-company data access, security breach
**Solution**: Unique service role key per company

### ❌ Client-Side Secrets

**Problem**: Exposing service keys in client code
**Issue**: Security vulnerability, unauthorized access
**Solution**: Server-side only API routes

### ❌ Missing Rate Limiting

**Problem**: No company-specific rate limiting
**Issue**: One company can affect others, DoS vulnerability  
**Solution**: Per-company rate limiting implementation

## Support and Monitoring

### Health Checks Per Company

```typescript
// Company-specific health monitoring
export async function GET() {
  const health = {
    firebase: await checkFirebaseHealth(),
    supabase: await checkSupabaseHealth(),
    auth_flow: await testAuthFlow(),
    company_id: process.env.COMPANY_ID
  }
  
  return Response.json(health)
}
```

### Company-Specific Metrics

```typescript
// Metrics per company
const metrics = {
  daily_authentications: await getAuthCount(companyId, 'today'),
  success_rate: await getSuccessRate(companyId, '7d'),
  average_response_time: await getResponseTime(companyId, '1h'),
  sms_costs: await getSMSCosts(companyId, 'month')
}
```

## Conclusion

The `@al-hamoud/authx` library is perfectly designed for multi-tenant environments:

**✅ Complete Isolation**: Each company operates independently
**✅ Shared Codebase**: Common library reduces maintenance
**✅ Scalable Architecture**: Easy to add new companies
**✅ Security First**: No cross-company data leakage possible

**Next Steps**:
- 📖 [Integration Guide](./integration-guide.md) - Setup walkthrough
- 🎨 [Examples](./examples.md) - Implementation examples
- 🛠️ [Troubleshooting](./troubleshooting.md) - Common issues
- 📊 [API Reference](./api-reference.md) - Complete API docs 
 