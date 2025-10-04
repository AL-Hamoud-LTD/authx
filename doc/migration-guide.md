# @al-hamoud/authx Migration Guide

## 📈 Version Upgrade Instructions

This guide helps you migrate between different versions of `@al-hamoud/authx` and handle breaking changes.

## Current Version: v1.2.1

### Latest Features
- ✅ **Enhanced Countries Prop**: Flexible typing for custom countries
- ✅ **Auto-fallback**: Graceful handling of missing countries
- ✅ **Better TypeScript**: No type assertions needed
- ✅ **Backward Compatible**: No breaking changes

## Migration Paths

### From v1.2.0 to v1.2.1

**🎉 No Breaking Changes - Drop-in Replacement**

#### Update Package

```bash
npm update @al-hamoud/authx
# or
npm install @al-hamoud/authx@latest
```

#### Enhanced TypeScript Experience

**Before v1.2.1** (required workarounds):

```typescript
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// ❌ TypeScript error in v1.2.0
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
}

// Required workaround
<Authx countries={customCountries as any} />
```

**After v1.2.1** (clean implementation):

```typescript
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// ✅ Clean TypeScript in v1.2.1
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
}

// No type assertions needed
<Authx countries={customCountries} />
```

#### Auto-fallback Improvements

```typescript
// v1.2.1 gracefully handles missing countries
const partialCountries = {
  GB: COUNTRIES.GB,
  // Missing other countries - auto-fallback to defaults
}

<Authx 
  countries={partialCountries}
  initialCountry="US" // Will fallback to default COUNTRIES.US
/>
```

### From v1.1.x to v1.2.x

#### Breaking Changes: None

#### New Features Available

1. **Enhanced Countries Configuration**
2. **Improved TypeScript Support**
3. **Better Error Handling**

#### Migration Steps

```bash
# 1. Update package
npm install @al-hamoud/authx@^1.2.0

# 2. Remove type workarounds (if any)
# No code changes required - fully backward compatible

# 3. Test your implementation
npm run dev
```

### From v1.0.x to v1.2.x

#### Breaking Changes: None

#### Major Enhancements

1. **Countries Prop Flexibility**
2. **TypeScript Improvements**
3. **Auto-fallback System**

#### Migration Example

**v1.0.x Implementation**:

```typescript
import { Authx } from '@al-hamoud/authx'

// Basic implementation
<Authx 
  initialCountry="GB"
  // Limited countries customization
/>
```

**v1.2.x Enhanced Implementation**:

```typescript
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// Enhanced with custom countries
const businessCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
  AE: COUNTRIES.AE,
  // Add custom countries
  CA: { name: 'Canada', dial: '+1', flag: '🇨🇦', min: 10, max: 10 },
}

<Authx 
  countries={businessCountries}
  initialCountry="GB"
  // All v1.0.x props still work
/>
```

### From v0.x to v1.x

#### Major Breaking Changes

If upgrading from a pre-1.0 version, there may be significant changes. Contact support for specific migration assistance.

## Environment Variables Migration

### Current Standard (v1.2.1)

```bash
# Client-side (Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id

# Server-side (Supabase)  
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional
AUTHX_VERIFY_ENDPOINT=/api/auth/verify-id-token
```

### Legacy Environment Variables

If you were using different variable names, update them:

```bash
# ❌ Legacy names (update these)
FIREBASE_PROJECT_ID=project-id
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...

# ✅ Current standard
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## API Route Migration

### Current Standard (v1.2.1)

```typescript
// app/api/auth/verify-id-token/route.ts
export const runtime = 'edge'

import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

export async function POST(req: Request) {
  return handler(req)
}
```

### Legacy API Routes

If you have custom implementation, migrate to the standard:

```typescript
// ❌ Legacy custom implementation
import { verifyFirebaseIdToken, ensureSupabaseUser } from '@al-hamoud/authx'

export default async function handler(req, res) {
  // Custom verification logic
  const payload = await verifyFirebaseIdToken(token, projectId)
  // Manual user creation
  const user = await ensureSupabaseUser(admin, payload)
  // Custom response
  res.json({ success: true, user })
}

// ✅ Current standard
import { buildVerifyRouteHandler } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

export async function POST(req: Request) {
  return handler(req)
}
```

## Component Usage Migration

### Prop Changes

#### No Breaking Changes in v1.2.1

All previous props remain functional:

```typescript
// ✅ All these props continue to work
<Authx 
  verifyEndpoint="/api/auth/verify-id-token"
  initialCountry="GB"
  theme="light"
  size="md"
  colorScheme={{ primary: "#3b82f6" }}
  className="custom-auth"
  onSuccess={(userData) => console.log(userData)}
  onError={(error) => console.error(error)}
/>
```

#### New Props Available

```typescript
// ✅ New props you can now use
<Authx 
  countries={customCountries}     // Enhanced in v1.2.1
  // All existing props continue to work
/>
```

## TypeScript Migration

### v1.2.1 Type Improvements

**Before (required workarounds)**:

```typescript
// ❌ TypeScript errors in older versions
import { Authx, COUNTRIES } from '@al-hamoud/authx'

const countries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
} as const // Required workaround

<Authx countries={countries as any} /> // Type assertion needed
```

**After (clean types)**:

```typescript
// ✅ Clean TypeScript in v1.2.1
import { Authx, COUNTRIES } from '@al-hamoud/authx'

const countries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
}

<Authx countries={countries} /> // No assertions needed
```

### Type Definitions

Current type exports (v1.2.1):

```typescript
// Available type imports
import type {
  AuthxProps,
  CountryConfig,
  CountryCode,
  VerifyResponse,
  FirebaseIdTokenPayload,
  ColorScheme,
  ThemeType,
  SizeVariant,
  CustomLabels,
  VisibilityControls
} from '@al-hamoud/authx'
```

## Deployment Migration

### Vercel/Netlify

#### Environment Variables

Ensure all environment variables are properly set:

```bash
# Production environment variables checklist
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY (marked as secret)
```

#### Build Configuration

```json
// package.json - ensure compatible scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@al-hamoud/authx": "^1.2.1",
    "next": "^13.0.0"
  }
}
```

## Testing Migration

### Test Suite Updates

```typescript
// Updated test cases for v1.2.1
describe('Authx Component', () => {
  it('handles custom countries without type errors', () => {
    const customCountries = {
      GB: COUNTRIES.GB,
      US: COUNTRIES.US,
    }
    
    render(<Authx countries={customCountries} />)
    // Test passes without type assertions
  })

  it('auto-fallbacks missing countries', () => {
    const partialCountries = {
      GB: COUNTRIES.GB,
    }
    
    render(
      <Authx 
        countries={partialCountries}
        initialCountry="US" // Should fallback to default
      />
    )
    // Component should handle gracefully
  })
})
```

## Rollback Strategy

### If Issues Occur

#### Quick Rollback

```bash
# Rollback to previous version
npm install @al-hamoud/authx@1.2.0

# Or pin to specific version
npm install @al-hamoud/authx@^1.1.0
```

#### Gradual Migration

```typescript
// Test new features gradually
const useNewCountriesFeature = process.env.NODE_ENV === 'development'

<Authx 
  countries={useNewCountriesFeature ? customCountries : undefined}
  // Keep existing implementation as fallback
/>
```

## Common Migration Issues

### 1. TypeScript Compilation Errors

**Issue**: TypeScript errors after upgrade

**Solution**:

```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Restart TypeScript service in VS Code
# Command Palette -> "TypeScript: Restart TS Server"
```

### 2. Environment Variable Issues

**Issue**: Environment variables not loading

**Solution**:

```typescript
// Add environment check
console.log({
  NODE_ENV: process.env.NODE_ENV,
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
})
```

### 3. Build Failures

**Issue**: Build fails after upgrade

**Solution**:

```bash
# Clear all caches
npm run clean  # if available
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

## Version Compatibility Matrix

| Feature | v1.0.x | v1.1.x | v1.2.0 | v1.2.1 |
|---------|--------|--------|--------|--------|
| Basic Auth | ✅ | ✅ | ✅ | ✅ |
| Custom Countries | ❌ | ❌ | ⚠️ | ✅ |
| TypeScript Support | ✅ | ✅ | ✅ | ✅✅ |
| Auto-fallback | ❌ | ❌ | ❌ | ✅ |
| Edge Runtime | ✅ | ✅ | ✅ | ✅ |

**Legend**:
- ✅ Full support
- ✅✅ Enhanced support  
- ⚠️ Limited support
- ❌ Not available

## Migration Checklist

### Pre-Migration

- [ ] Review current implementation
- [ ] Note any custom modifications
- [ ] Backup current code
- [ ] Test in development environment
- [ ] Review breaking changes (if any)

### During Migration

- [ ] Update package version
- [ ] Remove type workarounds (v1.2.1)
- [ ] Test basic authentication flow
- [ ] Verify custom countries (if used)
- [ ] Check TypeScript compilation
- [ ] Test in development

### Post-Migration

- [ ] Deploy to staging
- [ ] Run full test suite
- [ ] Verify production environment
- [ ] Monitor error rates
- [ ] Update documentation

### Rollback Plan

- [ ] Know previous version number
- [ ] Have rollback commands ready
- [ ] Monitor for 24-48 hours
- [ ] Document any issues

## Support

### Getting Help

1. **Check [Troubleshooting Guide](./troubleshooting.md)** for common issues
2. **Review [Examples](./examples.md)** for implementation patterns
3. **Consult [API Reference](./api-reference.md)** for prop details
4. **GitHub Issues** for bug reports and feature requests

### Migration Support

For complex migrations or custom implementations:

- **GitHub Issues**: Technical questions and bug reports
- **Documentation**: Complete guides and examples
- **Community**: Share experiences and solutions

## Future Versions

### Planned Features

- **v1.3.x**: Enhanced animation system
- **v1.4.x**: Advanced responsive features  
- **v2.0.x**: Major feature additions (TBD)

### Deprecation Policy

- **Minor versions** (1.x): No breaking changes
- **Major versions** (2.x): May include breaking changes
- **Deprecation notices**: 6 months before removal
- **Migration guides**: Provided for all breaking changes

Stay updated with the latest releases and migration guides through our [GitHub repository](https://github.com/AL-Hamoud-LTD/authx). 
 