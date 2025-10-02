# Examples for @al-hamoud/authx

This folder contains example snippets for building a simple `<Authx />` UI that:

- lets a user pick a country code (e.g. +44, +1) and enter a phone number,
- auto-sends the OTP when the phone is valid (or allows manual send),
- shows a 6-box OTP input and auto-verifies when complete,
- verifies with your server endpoint that checks the Firebase ID token and ensures a Supabase user.

Below is a full example you can copy into your Next.js app (`app/` directory).

> Note: This is a demo component only. It requires `react`, `firebase` (client), and your own API route that uses `buildVerifyRouteHandler` from this library.

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
