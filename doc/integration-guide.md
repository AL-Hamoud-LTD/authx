# @al-hamoud/authx Integration Guide

## 🚀 Complete Setup Walkthrough

This guide walks you through setting up `@al-hamoud/authx` in a Next.js project with Firebase and Supabase integration.

## Prerequisites

- Node.js 18+ 
- Next.js 13+ (App Router)
- Firebase account
- Supabase account

## Step 1: Create Firebase Project

### 1.1 Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., `your-company-auth`)
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Phone** provider
3. Enable **Phone** authentication
4. Save

### 1.3 Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. In **General** tab, scroll to **Your apps**
3. Click **Web app** icon (`</>`)
4. Register app with name (e.g., `your-app`)
5. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 1.4 Configure reCAPTCHA (Important!)

1. Go to **Authentication** → **Settings** → **Phone**
2. Add your domain to **Authorized domains**:
   - `localhost` (for development)
   - `your-domain.com` (for production)

## Step 2: Create Supabase Project

### 2.1 Create Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Choose organization and enter:
   - **Name**: `your-company-auth`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
4. Create project

### 2.2 Get Supabase Configuration

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (anon/public)
   - **Project API Key** (anon key)
   - **Service Role Key** (secret - keep secure!)

### 2.3 Configure User Schema (Optional)

The library creates users automatically, but you can extend the schema:

```sql
-- Optional: Add custom fields to auth.users metadata
-- This is handled automatically by the library
```

## Step 3: Install and Configure Next.js

### 3.1 Install Dependencies

```bash
npm install @al-hamoud/authx
npm install firebase  # if not already installed
```

### 3.2 Environment Variables

Create `.env.local`:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Supabase Configuration (Server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Custom verify endpoint
AUTHX_VERIFY_ENDPOINT=/api/auth/verify-id-token
```

### 3.3 Create API Route

Create `app/api/auth/verify-id-token/route.ts`:

```typescript
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

### 3.4 Add Authx Component

Create `app/auth/page.tsx`:

```typescript
'use client'

import { Authx } from '@al-hamoud/authx'

export default function AuthPage() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Phone Authentication
        </h1>
        
        <Authx 
          firebaseConfig={firebaseConfig}
          verifyEndpoint="/api/auth/verify-id-token"
          initialCountry="GB"
          theme="light"
        />
      </div>
    </div>
  )
}
```

## Step 4: Add Authentication Context (Recommended)

### 4.1 Create Auth Context

Create `contexts/AuthContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  uid: string
  phoneNumber: string
  email?: string
  supabaseUserId: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session
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
      setLoading(false)
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('authx_user', JSON.stringify(userData))
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authx_user')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 4.2 Wrap App with AuthProvider

Update `app/layout.tsx`:

```typescript
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 4.3 Enhanced Auth Page with Context

Update `app/auth/page.tsx`:

```typescript
'use client'

import { Authx } from '@al-hamoud/authx'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
  const { isAuthenticated, login, logout, user } = useAuth()
  const router = useRouter()

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  }

  // Listen for successful authentication
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      const { uid, phoneNumber, email, supabaseUserId } = event.detail
      login({ uid, phoneNumber, email, supabaseUserId })
      router.push('/dashboard')
    }

    window.addEventListener('authx-success', handleAuthSuccess as EventListener)
    return () => {
      window.removeEventListener('authx-success', handleAuthSuccess as EventListener)
    }
  }, [login, router])

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-6">Phone: {user?.phoneNumber}</p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Phone Authentication
        </h1>
        
        <Authx 
          firebaseConfig={firebaseConfig}
          verifyEndpoint="/api/auth/verify-id-token"
          initialCountry="GB"
          theme="light"
          onSuccess={(userData) => {
            login(userData)
            router.push('/dashboard')
          }}
        />
      </div>
    </div>
  )
}
```

## Step 5: Production Deployment

### 5.1 Environment Variables Setup

**Vercel/Netlify:**
- Add all environment variables to your deployment platform
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept secret

**Domain Configuration:**
- Add your production domain to Firebase Authorized domains
- Update CORS settings in Supabase if needed

### 5.2 Security Checklist

- ✅ Firebase project isolated per company
- ✅ Supabase service role key secured
- ✅ Production domains authorized in Firebase
- ✅ Rate limiting on API routes (recommended)
- ✅ CORS properly configured

## Step 6: Testing

### 6.1 Development Testing

1. Start development server: `npm run dev`
2. Navigate to `/auth`
3. Enter a phone number
4. Check console for any errors
5. Verify SMS reception
6. Complete OTP verification

### 6.2 Common Test Numbers

Firebase provides test phone numbers for development:

```
Phone: +1 650-555-3434
OTP: 654321
```

Add in Firebase Console → Authentication → Settings → Phone numbers for testing.

## Step 7: Customization

### 7.1 Styling Options

```typescript
<Authx 
  theme="dark"
  size="lg"
  colorScheme={{
    primary: "#3b82f6",
    background: "#1f2937",
    text: "#f9fafb"
  }}
  className="custom-auth"
/>
```

### 7.2 Custom Countries

```typescript
import { COUNTRIES } from '@al-hamoud/authx'

const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
  AE: COUNTRIES.AE,
}

<Authx countries={customCountries} />
```

## Next Steps

- 📖 Read the [API Reference](./api-reference.md) for all configuration options
- 🔒 Review [Multi-tenant Guide](./multi-tenant-guide.md) for company isolation
- 🎨 Check [Examples](./examples.md) for advanced styling and features
- 🛠️ See [Troubleshooting](./troubleshooting.md) for common issues

## Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/AL-Hamoud-LTD/authx/issues)
- **Documentation**: [Complete documentation](./README.md)
- **Examples**: [Live examples and demos](./examples.md) 
 