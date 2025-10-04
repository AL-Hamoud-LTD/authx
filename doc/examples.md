# @al-hamoud/authx Examples

## 🎨 Complete Usage Examples

This document provides comprehensive examples for implementing `@al-hamoud/authx` with various styling, animation, and responsive configurations.

## Basic Examples

### 1. Minimal Setup

```tsx
import { Authx } from '@al-hamoud/authx'

export default function BasicAuth() {
  return <Authx />
}
```

### 2. Complete Configuration

```tsx
'use client'

import { Authx } from '@al-hamoud/authx'
import { useRouter } from 'next/navigation'

export default function CompleteAuth() {
  const router = useRouter()

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Authx 
        firebaseConfig={firebaseConfig}
        verifyEndpoint="/api/auth/verify-id-token"
        initialCountry="GB"
        onSuccess={(userData) => {
          console.log('Authentication successful:', userData)
          router.push('/dashboard')
        }}
        onError={(error) => {
          console.error('Authentication failed:', error)
        }}
      />
    </div>
  )
}
```

## Theme Examples

### 3. Dark Theme

```tsx
import { Authx } from '@al-hamoud/authx'

export default function DarkThemeAuth() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Authx 
        theme="dark"
        colorScheme={{
          primary: "#3b82f6",
          secondary: "#374151", 
          background: "#1f2937",
          text: "#f9fafb",
          border: "#4b5563",
          error: "#f87171",
          success: "#34d399"
        }}
      />
    </div>
  )
}
```

### 4. Custom Brand Theme

```tsx
import { Authx } from '@al-hamoud/authx'

export default function BrandAuth() {
  return (
    <Authx 
      theme="custom"
      colorScheme={{
        primary: "#7c3aed",      // Purple brand
        secondary: "#f3e8ff",    // Light purple
        background: "#ffffff",
        text: "#1f2937",
        border: "#e5e7eb",
        error: "#dc2626",
        success: "#059669"
      }}
      size="lg"
      borderRadius="16px"
      gradient={{
        button: {
          variant: "linear",
          direction: "45deg",
          stops: [
            { color: "#7c3aed", position: "0%" },
            { color: "#a855f7", position: "100%" }
          ]
        }
      }}
    />
  )
}
```

## Size and Layout Examples

### 5. Compact Layout

```tsx
import { Authx } from '@al-hamoud/authx'

export default function CompactAuth() {
  return (
    <Authx 
      size="sm"
      layout="compact"
      countryPosition="top"
      buttonPosition="inline"
      width="320px"
      padding="12px"
      labels={{
        phoneNumber: "Mobile",
        sendCode: "Send",
        verify: "OK"
      }}
    />
  )
}
```

### 6. Large Format

```tsx
import { Authx } from '@al-hamoud/authx'

export default function LargeAuth() {
  return (
    <Authx 
      size="xl"
      width="600px"
      padding="32px"
      borderRadius="24px"
      shadow="2xl"
      fontFamily="Inter"
      typography={{
        heading: {
          family: "Inter",
          weight: 700,
          size: "24px"
        },
        body: {
          family: "Inter",
          weight: 400,
          size: "16px",
          lineHeight: "1.6"
        }
      }}
    />
  )
}
```

## Animation Examples

### 7. Smooth Animations

```tsx
import { Authx } from '@al-hamoud/authx'

export default function AnimatedAuth() {
  return (
    <Authx 
      animations={{
        enabled: true,
        duration: "500ms",
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        fadeIn: true,
        scaleIn: true,
        slideDirection: "up"
      }}
      shadow="lg"
      gradient={{
        background: {
          variant: "linear",
          direction: "135deg",
          stops: [
            { color: "#667eea", position: "0%" },
            { color: "#764ba2", position: "100%" }
          ]
        }
      }}
    />
  )
}
```

### 8. Minimal Animation (Accessibility)

```tsx
import { Authx } from '@al-hamoud/authx'

export default function AccessibleAuth() {
  return (
    <Authx 
      animations={{
        enabled: true,
        duration: "150ms",
        easing: "ease-out",
        fadeIn: false,
        scaleIn: false,
        slideDirection: "none"
      }}
      a11y={{
        ariaLabel: "Phone authentication form",
        focusManagement: true,
        announceSteps: true,
        keyboardNavigation: true,
        reducedMotion: true,
        highContrast: false
      }}
    />
  )
}
```

## Responsive Examples

### 9. Mobile-First Design

```tsx
import { Authx } from '@al-hamoud/authx'

export default function ResponsiveAuth() {
  return (
    <div className="p-4 min-h-screen flex items-center justify-center">
      <Authx 
        responsive={{
          breakpoints: {
            mobile: "480px",
            tablet: "768px",
            desktop: "1024px"
          },
          mobile: {
            size: "sm",
            width: "100%"
          },
          tablet: {
            size: "md", 
            width: "400px"
          },
          desktop: {
            size: "lg",
            width: "480px"
          }
        }}
        className="w-full max-w-md"
      />
    </div>
  )
}
```

## Custom Countries Examples

### 10. Regional Configuration

```tsx
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// Middle East focused
const middleEastCountries = {
  AE: COUNTRIES.AE,  // UAE
  SA: COUNTRIES.SA,  // Saudi Arabia
  KW: { name: 'Kuwait', dial: '+965', flag: '🇰🇼', min: 8, max: 8 },
  QA: { name: 'Qatar', dial: '+974', flag: '🇶🇦', min: 8, max: 8 },
  BH: { name: 'Bahrain', dial: '+973', flag: '🇧🇭', min: 8, max: 8 },
  OM: { name: 'Oman', dial: '+968', flag: '🇴🇲', min: 8, max: 8 },
}

export default function RegionalAuth() {
  return (
    <Authx 
      countries={middleEastCountries}
      initialCountry="AE"
      labels={{
        phoneNumber: "رقم الهاتف",
        sendCode: "إرسال الرمز",
        enterCode: "أدخل الرمز",
        verify: "تحقق"
      }}
    />
  )
}
```

### 11. European Configuration

```tsx
import { Authx, COUNTRIES } from '@al-hamoud/authx'

const europeanCountries = {
  GB: COUNTRIES.GB,
  DE: COUNTRIES.DE,
  FR: COUNTRIES.FR,
  IT: { name: 'Italy', dial: '+39', flag: '🇮🇹', min: 9, max: 10 },
  ES: { name: 'Spain', dial: '+34', flag: '🇪🇸', min: 9, max: 9 },
  NL: { name: 'Netherlands', dial: '+31', flag: '🇳🇱', min: 9, max: 9 },
}

export default function EuropeanAuth() {
  return (
    <Authx 
      countries={europeanCountries}
      initialCountry="GB"
      theme="light"
      colorScheme={{
        primary: "#1e40af",  // EU blue
        secondary: "#f1f5f9"
      }}
    />
  )
}
```

## CSS Classes Examples

### 12. Tailwind CSS Integration

```tsx
import { Authx } from '@al-hamoud/authx'

export default function TailwindAuth() {
  return (
    <Authx 
      className="font-sans"
      cardClassName="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8"
      inputClassName="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      buttonClassName="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
      labelClassName="text-gray-700 font-medium text-sm mb-2 block"
    />
  )
}
```

### 13. CSS Modules Integration

```tsx
// auth.module.css
.authContainer {
  font-family: 'SF Pro Display', system-ui, sans-serif;
}

.authCard {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.authInput {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.authInput:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.authButton {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.authButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
```

```tsx
import { Authx } from '@al-hamoud/authx'
import styles from './auth.module.css'

export default function CSSModulesAuth() {
  return (
    <Authx 
      className={styles.authContainer}
      cardClassName={styles.authCard}
      inputClassName={styles.authInput}
      buttonClassName={styles.authButton}
    />
  )
}
```

## Advanced Styling Examples

### 14. Glassmorphism Design

```tsx
import { Authx } from '@al-hamoud/authx'

export default function GlassmorphismAuth() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Authx 
        cardStyle={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
        inputStyle={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          color: '#fff'
        }}
        buttonStyle={{
          background: 'rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          color: '#fff'
        }}
        colorScheme={{
          text: '#ffffff',
          border: 'rgba(255, 255, 255, 0.3)'
        }}
      />
    </div>
  )
}
```

### 15. Neumorphism Design

```tsx
import { Authx } from '@al-hamoud/authx'

export default function NeumorphismAuth() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#e0e5ec' }}
    >
      <Authx 
        cardStyle={{
          background: '#e0e5ec',
          borderRadius: '20px',
          boxShadow: '9px 9px 16px #a3a3a3, -9px -9px 16px #ffffff',
          border: 'none'
        }}
        inputStyle={{
          background: '#e0e5ec',
          border: 'none',
          borderRadius: '12px',
          boxShadow: 'inset 6px 6px 10px #a3a3a3, inset -6px -6px 10px #ffffff'
        }}
        buttonStyle={{
          background: '#e0e5ec',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '6px 6px 10px #a3a3a3, -6px -6px 10px #ffffff',
          color: '#333'
        }}
        colorScheme={{
          primary: '#667eea',
          text: '#333333',
          border: 'transparent'
        }}
      />
    </div>
  )
}
```

## Integration Examples

### 16. Next.js App Router with Context

```tsx
// contexts/AuthContext.tsx
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

```tsx
// app/auth/page.tsx
'use client'

import { Authx } from '@al-hamoud/authx'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AuthPage() {
  const { login, logout, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [stayLoggedIn, setStayLoggedIn] = useState(false)

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-6">
            Authenticated as: {user?.phoneNumber}
          </p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Welcome Back
        </h1>
        
        <Authx 
          firebaseConfig={firebaseConfig}
          verifyEndpoint="/api/auth/verify-id-token"
          initialCountry="GB"
          theme="light"
          size="lg"
          onSuccess={(userData) => {
            if (stayLoggedIn) {
              login(userData)
            }
            router.push('/dashboard')
          }}
          onError={(error) => {
            console.error('Authentication failed:', error)
          }}
          className="mb-6"
        />

        <div className="flex items-center justify-center mt-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">Stay logged in</span>
          </label>
        </div>
      </div>
    </div>
  )
}
```

### 17. Form Validation Integration

```tsx
import { Authx } from '@al-hamoud/authx'
import { useState } from 'react'

export default function ValidatedAuth() {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [authEnabled, setAuthEnabled] = useState(false)

  const canAuthenticate = termsAccepted && privacyAccepted

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>
      
      {/* Terms and Conditions */}
      <div className="space-y-4 mb-6">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
          </span>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {/* Auth Component */}
      <div className={canAuthenticate ? '' : 'opacity-50 pointer-events-none'}>
        <Authx 
          theme="light"
          size="md"
          validation={{
            showErrors: true,
            showStatus: true,
            customMessages: {
              invalidPhone: "Please enter a valid phone number",
              codeSent: "Verification code sent to your phone",
              verified: "Phone verified successfully!"
            }
          }}
          onSuccess={(userData) => {
            if (canAuthenticate) {
              console.log('Account created:', userData)
              // Proceed with account creation
            }
          }}
        />
      </div>

      {!canAuthenticate && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Please accept the terms and privacy policy to continue
        </p>
      )}
    </div>
  )
}
```

## Testing Examples

### 18. Development Mode with Test Numbers

```tsx
import { Authx } from '@al-hamoud/authx'

// Firebase test phone numbers (development only)
const TEST_PHONE_NUMBERS = {
  '+1 650-555-3434': '654321',  // US test number
  '+44 7700 900123': '123456',  // UK test number
}

export default function TestAuth() {
  return (
    <div className="max-w-md mx-auto p-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Test Mode - Use these numbers:
          </h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            {Object.entries(TEST_PHONE_NUMBERS).map(([phone, code]) => (
              <li key={phone}>
                {phone} → Code: {code}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Authx 
        theme="light"
        onSuccess={(userData) => {
          console.log('Test auth successful:', userData)
        }}
        onError={(error) => {
          console.error('Test auth failed:', error)
        }}
      />
    </div>
  )
}
```

These examples demonstrate the full range of customization options available in `@al-hamoud/authx`. Mix and match these patterns to create the perfect authentication experience for your application.

## Next Steps

- 📖 [API Reference](./api-reference.md) - Complete props documentation
- 🔒 [Multi-tenant Guide](./multi-tenant-guide.md) - Company isolation
- 🛠️ [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- 📋 [Integration Guide](./integration-guide.md) - Setup walkthrough 
 