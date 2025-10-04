# @al-hamoud/authx Troubleshooting Guide

## 🛠️ Common Issues and Solutions

This guide addresses common problems you might encounter when implementing `@al-hamoud/authx` and provides tested solutions.

## Firebase Issues

### 1. "network-request-failed" Error

**Problem**: Firebase authentication fails with network error

**Common Causes**:
- Network interceptors blocking Firebase requests
- CORS issues in development
- Invalid Firebase configuration

**Solutions**:

```typescript
// ❌ This can cause network-request-failed
if (typeof window !== 'undefined') {
  // Remove any fetch interceptors that might block Firebase
  window.fetch = originalFetch
}

// ✅ Ensure clean Firebase initialization
import { getApps, initializeApp } from 'firebase/app'

function ensureFirebase(config: FirebaseOptions) {
  if (!getApps().length) {
    initializeApp(config)
  }
}
```

**Debug Steps**:
1. Check browser Network tab for failed requests
2. Verify Firebase config values in browser console
3. Test without any network interceptors/middleware
4. Try incognito mode to rule out browser extensions

### 2. reCAPTCHA Issues

**Problem**: reCAPTCHA not loading or verification failing

**Solutions**:

```typescript
// Ensure reCAPTCHA container exists
<div id="authx-recaptcha" />

// Add domains to Firebase Authorized domains:
// - localhost (development)
// - your-domain.com (production)
```

**Firebase Console Setup**:
1. Go to Authentication → Settings → Phone
2. Add authorized domains:
   - `localhost`
   - `127.0.0.1`
   - Your production domain

### 3. SMS Not Received

**Problem**: OTP SMS messages not arriving

**Debug Checklist**:

```typescript
// 1. Verify phone number format
const { e164, valid } = toE164('GB', '07123456789')
console.log('E164:', e164, 'Valid:', valid) // Should be +447123456789, true

// 2. Check Firebase quotas
// Firebase Console → Usage → Authentication

// 3. Test with Firebase test numbers (development)
const testNumbers = {
  '+1 650-555-3434': '654321',
  '+44 7700 900123': '123456',
}
```

**Firebase Test Numbers Setup**:
1. Firebase Console → Authentication → Settings
2. Phone numbers for testing
3. Add test number and verification code

### 4. Invalid Project ID

**Problem**: "Invalid project ID" error

**Solution**:

```typescript
// ✅ Verify environment variables
console.log({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
})

// ✅ Ensure all values are present and correct
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}
```

## Supabase Issues

### 5. Service Role Key Errors

**Problem**: Supabase operations failing with authentication errors

**Common Issues**:

```typescript
// ❌ Using anon key instead of service role key
const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_ANON_KEY!, // WRONG!
})

// ✅ Use service role key
const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // CORRECT
})
```

**Verification**:
```bash
# Check if service role key is properly set
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c
# Should be around 200+ characters
```

### 6. User Creation Failures

**Problem**: Users not being created in Supabase

**Debug Steps**:

```typescript
// Add logging to debug user creation
import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  onUserCreated: (user) => {
    console.log('User created successfully:', user.id)
  },
  onError: (error) => {
    console.error('User creation failed:', error)
  }
})
```

**Common RLS Issues**:

```sql
-- Ensure auth.users table has proper RLS policies
-- This query should run in Supabase SQL Editor

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Service role should bypass RLS
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname LIKE '%service_role%';
```

## Next.js Issues

### 7. Hydration Mismatches

**Problem**: React hydration errors with authentication state

**Solution**:

```typescript
// ✅ Avoid hydration issues with proper loading states
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Important!

  useEffect(() => {
    // Only access localStorage after hydration
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('authx_user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('authx_user')
        }
      }
      setLoading(false) // Set loading to false after checking
    }
  }, [])

  // Show loading state until hydration complete
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ user, loading, /* ... */ }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 8. API Route Issues

**Problem**: Verification endpoint returning errors

**Debug API Route**:

```typescript
// app/api/auth/verify-id-token/route.ts
export const runtime = 'edge'

import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

export async function POST(req: Request) {
  try {
    // Add debug logging
    console.log('API route called:', req.url)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    return await handler(req)
  } catch (error) {
    console.error('API route error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Add GET method for testing
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
```

**Test API Route**:
```bash
# Test if API route is accessible
curl http://localhost:3000/api/auth/verify-id-token

# Should return: {"status":"ok","timestamp":"...","environment":"development"}
```

## Environment Issues

### 9. Missing Environment Variables

**Problem**: Environment variables not loading properly

**Debug Checklist**:

```typescript
// Add environment check component
export function EnvironmentCheck() {
  const envVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Environment Variables Check</h3>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} className={value ? 'text-green-600' : 'text-red-600'}>
          {key}: {value ? '✓ Set' : '✗ Missing'}
        </div>
      ))}
    </div>
  )
}
```

**Common .env.local issues**:

```bash
# ❌ Missing NEXT_PUBLIC_ prefix for client-side vars
FIREBASE_API_KEY=AIzaSyC...

# ✅ Correct client-side environment variables
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id

# ✅ Server-side only (no NEXT_PUBLIC_ prefix)
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 10. Development vs Production Issues

**Problem**: Works in development but fails in production

**Production Checklist**:

```typescript
// 1. Verify production environment variables are set
// 2. Check authorized domains in Firebase
// 3. Verify CORS settings in Supabase
// 4. Test API routes in production

// Add production-specific debugging
if (process.env.NODE_ENV === 'production') {
  console.log('Production mode - reduced logging')
} else {
  console.log('Development mode - full logging')
}
```

**Vercel/Netlify Deployment**:
1. Add all environment variables to deployment platform
2. Ensure service role key is marked as secret
3. Test API routes after deployment
4. Check function logs for errors

## TypeScript Issues

### 11. Type Errors with Countries

**Problem**: TypeScript errors when using custom countries (pre-v1.2.1)

**v1.2.1+ Solution** (recommended):

```typescript
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// ✅ v1.2.1+ - No type errors
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
}

<Authx countries={customCountries} />
```

**Pre-v1.2.1 Workaround**:

```typescript
// ❌ Old version type error
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
} as const

// ✅ Workaround for older versions
<Authx countries={customCountries as any} />
```

### 12. Firebase Configuration Types

**Problem**: TypeScript errors with Firebase config

**Solution**:

```typescript
import { FirebaseOptions } from 'firebase/app'

// ✅ Properly typed Firebase config
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}

// ✅ Type-safe environment variable checking
const getFirebaseConfig = (): FirebaseOptions => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!apiKey || !authDomain || !projectId) {
    throw new Error('Missing required Firebase environment variables')
  }

  return { apiKey, authDomain, projectId }
}
```

## Performance Issues

### 13. Slow Authentication Response

**Problem**: Authentication taking too long

**Optimization Strategies**:

```typescript
// 1. Optimize API route with edge runtime
export const runtime = 'edge' // Important for performance

// 2. Add request/response logging
import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const response = await handler(req)
    const duration = Date.now() - startTime
    console.log(`Auth request completed in ${duration}ms`)
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Auth request failed after ${duration}ms:`, error)
    throw error
  }
}

// 3. Monitor Supabase response times
// Supabase Dashboard → Logs → API logs
```

## Browser Compatibility

### 14. Safari/iOS Issues

**Problem**: Authentication issues on Safari/iOS

**Solutions**:

```typescript
// 1. Ensure proper viewport meta tag
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />

// 2. Handle iOS Safari specific issues
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

if (isSafari) {
  // Add Safari-specific handling
  console.log('Safari detected - applying workarounds')
}

// 3. Test OTP input on mobile
<Authx 
  inputStyle={{
    fontSize: '16px', // Prevents zoom on iOS
    WebkitAppearance: 'none' // Remove iOS styling
  }}
/>
```

### 15. CORS Issues

**Problem**: CORS errors in development or production

**Solutions**:

```typescript
// 1. Add proper CORS headers to API routes
export async function POST(req: Request) {
  const response = await handler(req)
  
  // Add CORS headers if needed
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

## Debug Utilities

### Debug Component

```typescript
'use client'

import { useState } from 'react'

export function AuthDebugger() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  // Test Firebase connection
  const testFirebase = async () => {
    try {
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      addLog(`Firebase auth initialized: ${auth.app.name}`)
    } catch (error) {
      addLog(`Firebase error: ${error}`)
    }
  }

  // Test API route
  const testAPI = async () => {
    try {
      const response = await fetch('/api/auth/verify-id-token')
      const data = await response.json()
      addLog(`API test: ${JSON.stringify(data)}`)
    } catch (error) {
      addLog(`API error: ${error}`)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-md">
      <h3 className="font-bold mb-4">Auth Debugger</h3>
      
      <div className="space-x-2 mb-4">
        <button 
          onClick={testFirebase}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Test Firebase
        </button>
        <button 
          onClick={testAPI}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Test API
        </button>
        <button 
          onClick={() => setLogs([])}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          Clear
        </button>
      </div>

      <div className="bg-black text-green-400 p-2 rounded text-xs max-h-40 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}
```

## Getting Help

### 1. Enable Debug Mode

```typescript
// Add debug logging to your implementation
<Authx 
  onSuccess={(userData) => {
    console.log('✅ Auth Success:', userData)
  }}
  onError={(error) => {
    console.error('❌ Auth Error:', error)
  }}
  // Add step tracking
  onStepChange={(step) => {
    console.log('🔄 Step Change:', step)
  }}
/>
```

### 2. Collect System Information

```typescript
// System info for bug reports
const systemInfo = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  cookieEnabled: navigator.cookieEnabled,
  online: navigator.onLine,
  url: window.location.href,
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
}

console.log('System Info:', systemInfo)
```

### 3. Report Issues

When reporting issues, include:

- 🔍 **Error message** (full stack trace)
- 🌐 **Browser/device** information
- 📱 **Environment** (development/production)
- 🔧 **Configuration** (sanitized, no secrets)
- 📋 **Steps to reproduce**
- 📊 **Expected vs actual behavior**

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| network-request-failed | Remove fetch interceptors, check Firebase config |
| reCAPTCHA not loading | Add authorized domains in Firebase |
| SMS not received | Check phone format, Firebase quotas, test numbers |
| Supabase errors | Verify service role key, check RLS policies |
| Hydration errors | Add loading states, check localStorage access |
| Environment variables | Verify NEXT_PUBLIC_ prefix, check .env.local |
| Type errors | Update to v1.2.1+, use proper types |
| Performance issues | Use edge runtime, monitor response times |
| CORS errors | Add CORS headers, check Supabase settings |

## Prevention Checklist

Before deploying:

- [ ] Test with actual phone numbers
- [ ] Verify all environment variables
- [ ] Check Firebase authorized domains
- [ ] Test API routes independently
- [ ] Validate Supabase permissions
- [ ] Test in production environment
- [ ] Verify CORS configuration
- [ ] Check browser compatibility
- [ ] Monitor performance metrics
- [ ] Set up error tracking

Need more help? Check the [Integration Guide](./integration-guide.md) or review [Examples](./examples.md) for working implementations. 
 