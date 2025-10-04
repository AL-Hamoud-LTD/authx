# Examples for @al-hamoud/authx v1.0.0

This folder contains comprehensive examples for the `<Authx />` component that now includes:

## 🚀 Core Authentication Features

- Country code picker with phone number input
- Auto-sends OTP when phone is valid (or manual send)
- 6-box OTP input with auto-verification
- Server verification with Firebase ID token and Supabase integration

## 🎨 Phase 1: Theme System (v0.0.4)

- **Theme Support**: Light/dark themes with custom color schemes
- **CSS Classes**: Component-level class customization
- **Size Variants**: sm, md, lg, xl size options
- **Text Customization**: Custom labels and visibility controls

## 🎯 Phase 2: Advanced Styling (v0.1.0)

- **Component Styling**: Individual style props for inputs, buttons, cards
- **Layout Variants**: Vertical, horizontal, compact layouts
- **CSS Variables**: Runtime theming with custom properties
- **Validation Enhancement**: Custom validation displays

## ✨ Phase 3: Animation & Responsive (v0.2.0)

- **Animation System**: Fade, slide, scale animations with custom timing
- **Responsive Design**: Breakpoint-aware adaptive layouts
- **Accessibility**: WCAG compliance with screen reader support

## 🎨 Phase 4: Advanced Design (v1.0.0)

- **Shadow System**: Modern elevation with 8 shadow variants
- **Custom Fonts**: Google Fonts integration with typography controls
- **Gradient System**: Linear, radial, conic gradients for all components

## 📋 Quick Examples

### Basic Usage

```tsx
import { Authx } from '@al-hamoud/authx'

export default function BasicAuth() {
  return <Authx />
}
```

### Custom Countries Configuration

```tsx
import { Authx, COUNTRIES } from '@al-hamoud/authx'

// Use only specific countries
const customCountries = {
  GB: COUNTRIES.GB,
  US: COUNTRIES.US,
  AE: COUNTRIES.AE,
  SA: COUNTRIES.SA,
}

export default function CustomCountriesAuth() {
  return (
    <Authx 
      countries={customCountries}
      initialCountry="AE"
      visibility={{ hideCountryNames: true }}
    />
  )
}
```

### Add Custom Country

```tsx
import { Authx, COUNTRIES } from '@al-hamoud/authx'

const extendedCountries = {
  ...COUNTRIES,
  CA: { name: 'Canada', dial: '+1', flag: '🇨🇦', min: 10, max: 10 },
  AU: { name: 'Australia', dial: '+61', flag: '🇦🇺', min: 9, max: 9 },
}

export default function ExtendedCountriesAuth() {
  return <Authx countries={extendedCountries} />
}
```

### Premium Dark Theme (All Features)

```tsx
export default function PremiumAuth() {
  return (
    <Authx
      // Phase 1: Theme System
      theme="dark"
      size="lg"
      colorScheme={{ primary: '#8b5cf6', background: '#0f172a' }}
      
      // Phase 2: Layout & Styling  
      layout="horizontal"
      cssVariables={{ '--authx-primary-color': '#8b5cf6' }}
      
      // Phase 3: Animation & Responsive
      animations={{ enabled: true, slideDirection: 'up', fadeIn: true }}
      responsive={{ mobile: { size: 'md' }, desktop: { size: 'lg' } }}
      
      // Phase 4: Advanced Design
      shadow="2xl"
      fontFamily="Space Grotesk"
      gradient={{
        button: {
          variant: 'linear',
          direction: '45deg', 
          stops: [
            { color: '#8b5cf6', position: '0%' },
            { color: '#c084fc', position: '100%' }
          ]
        }
      }}
    />
  )
}
```

### Glassmorphism Style

```tsx
export default function GlassAuth() {
  return (
    <Authx
      shadow="lg"
      gradient={{
        card: {
          variant: 'linear',
          stops: [
            { color: 'rgba(255, 255, 255, 0.25)', position: '0%' },
            { color: 'rgba(255, 255, 255, 0.1)', position: '100%' }
          ]
        }
      }}
      cardStyle={{
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}
    />
  )
}
```

## 📁 File Overview

- `ui/Authx.tsx.example` - Comprehensive examples showcasing all features
- `README.md` - This documentation with usage examples
- `package.json` - Dependencies and setup instructions

> **Note**: The component requires `react`, `firebase` (client), and your own API route that uses `buildVerifyRouteHandler` from this library.

## React Client (app/authx/page.tsx)

```tsx
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const COUNTRIES = {
  GB: { name: "United Kingdom", dial: "+44", flag: "🇬🇧", min: 10, max: 10 },
  US: { name: "United States", dial: "+1", flag: "🇺🇸", min: 10, max: 10 },
} as const;

function ensureFirebase(config: FirebaseOptions) {
  if (!getApps().length) initializeApp(config);
}

function isValidE164(e164: string) { return /^\+\d{10,15}$/.test(e164); }
function useE164(country: keyof typeof COUNTRIES, local: string) {
  const { dial, min, max } = COUNTRIES[country];
  const digits = local.replace(/\D/g, "");
  const e164 = `${dial}${digits}`;
  const valid = digits.length >= min && digits.length <= max && isValidE164(e164);
  return { e164, valid };
}

export default function Page() {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  };

  const [country, setCountry] = useState<keyof typeof COUNTRIES>("GB");
  const [localPhone, setLocalPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");

  const { e164, valid } = useE164(country, localPhone);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<any>(null);

  useEffect(() => { ensureFirebase(firebaseConfig); }, []);

  // Auto-send when valid
  useEffect(() => { if (valid && step === "phone") void handleSend(); }, [valid, step]);

  const otpValue = useMemo(() => (otp as string[]).join(""), [otp]);
  useEffect(() => { if (otpValue.length === 6) void handleVerify(); }, [otpValue]);

  async function handleSend() {
    try {
      setSending(true); setError(""); setStatus("Sending code…");
      const auth = getAuth();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "authx-recaptcha", { size: "invisible" });
        await recaptchaRef.current.render();
      }
      const confirmation = await signInWithPhoneNumber(auth, e164, recaptchaRef.current);
      confirmationRef.current = confirmation;
      setStatus("Code sent. Check your phone.");
      setStep("otp");
    } catch (e: any) { setError(e?.message || String(e)); setStatus(""); }
    finally { setSending(false); }
  }

  async function handleVerify() {
    try {
      const code = otpValue; if (code.length !== 6) return;
      setSending(true); setError(""); setStatus("Verifying code…");
      const { user } = await confirmationRef.current!.confirm(code);
      const idToken = await user.getIdToken(true);
      setStatus("Verifying with server…");
      const res = await fetch("/api/auth/verify-id-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
      const json = await res.json();
      if (json.ok) { setStatus("Verified ✓"); setStep("done"); } else { setError(json.error || "Server rejected"); setStatus(""); }
    } catch (e: any) { setError(e?.message || String(e)); setStatus(""); }
    finally { setSending(false); }
  }

  const onOtpChange = (idx: number, v: string) => {
    const d = v.replace(/\D/g, "");
    setOtp((prev: string[]) => { const next = [...prev]; next[idx] = d.slice(0, 1); return next; });
    const nextEl = document.querySelector<HTMLInputElement>(`#authx-otp-${idx + 1}`);
    if (d && nextEl) nextEl.focus();
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      {step === "phone" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Phone Number</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 8px", border: "1px solid #e5e7eb", borderRadius: 12, height: 48 }}>
              <span style={{ marginRight: 6 }}>{COUNTRIES[country].flag}</span>
              <select value={country} onChange={(e) => setCountry(e.target.value as keyof typeof COUNTRIES)} style={{ border: "none", background: "transparent" }}>
                {Object.entries(COUNTRIES).map(([code, { name, dial }]) => (
                  <option key={code} value={code}>{name} ({dial})</option>
                ))}
              </select>
              <span style={{ marginLeft: 6, fontWeight: 600 }}>{COUNTRIES[country].dial}</span>
            </div>
            <input type="tel" placeholder="Enter your phone number" value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} disabled={sending} style={{ flex: 1, height: 48, border: "1px solid #e5e7eb", borderRadius: 12, padding: "0 14px" }} />
          </div>
          <button type="button" onClick={handleSend} disabled={!valid || sending} style={{ height: 48, background: "#2563eb", color: "#fff", borderRadius: 12, fontWeight: 600 }}>Send Verification Code</button>
          {!!error && <div style={{ padding: 8, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12 }}>{error}</div>}
          {!!status && <div style={{ padding: 8, background: "#eff6ff", color: "#1e3a8a", border: "1px solid #bfdbfe", borderRadius: 12 }}>{status}</div>}
          <div id="authx-recaptcha" />
        </div>
      )}

      {step === "otp" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Enter 6-digit code</label>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {(otp as string[]).map((d, i) => (
              <input key={i} id={`authx-otp-${i}`} inputMode="numeric" maxLength={1} value={d} onChange={(e) => onOtpChange(i, e.target.value)} style={{ width: 48, height: 56, textAlign: "center", fontSize: 20, border: "1px solid #e5e7eb", borderRadius: 12 }} />
            ))}
          </div>
          <button type="button" onClick={handleVerify} disabled={sending || otpValue.length !== 6} style={{ height: 48, background: "#16a34a", color: "#fff", borderRadius: 12, fontWeight: 600 }}>Verify</button>
          {!!error && <div style={{ padding: 8, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12 }}>{error}</div>}
          {!!status && <div style={{ padding: 8, background: "#eff6ff", color: "#1e3a8a", border: "1px solid #bfdbfe", borderRadius: 12 }}>{status}</div>}
        </div>
      )}

      {step === "done" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16 }}>Phone verified successfully.</div>
      )}
    </div>
  );
}
```

## Server route (app/api/auth/verify-id-token/route.ts)

```ts
export const runtime = 'edge'
import { buildVerifyRouteHandler } from '@al-hamoud/authx'
import { getEnv } from '@al-hamoud/authx'

const handler = buildVerifyRouteHandler({
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  supabaseUrl: getEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
})

export async function POST(req: Request) { return handler(req) }
```

That’s it. The page auto-sends the code when the phone is valid; otherwise the user can click the button. When six digits are entered, it auto-verifies and shows success or error.
