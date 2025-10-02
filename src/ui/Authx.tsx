"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'

const COUNTRIES = {
  GB: { name: 'United Kingdom', dial: '+44', flag: '🇬🇧', min: 10, max: 10 },
  US: { name: 'United States', dial: '+1', flag: '🇺🇸', min: 10, max: 10 },
  AE: { name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', min: 9, max: 9 },
  SA: { name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', min: 9, max: 9 },
  DE: { name: 'Germany', dial: '+49', flag: '🇩🇪', min: 10, max: 11 },
  FR: { name: 'France', dial: '+33', flag: '🇫🇷', min: 9, max: 9 },
} as const

export type CountryCode = keyof typeof COUNTRIES

function ensureFirebase(config: FirebaseOptions) {
  if (!getApps().length) initializeApp(config)
}

function isValidE164(e164: string) {
  return /^\+\d{10,15}$/.test(e164)
}

function toE164(country: CountryCode, local: string) {
  const { dial, min, max } = COUNTRIES[country]
  const digits = local.replace(/\D/g, '')
  const e164 = `${dial}${digits}`
  const valid = digits.length >= min && digits.length <= max && isValidE164(e164)
  return { e164, valid }
}

export type AuthxProps = {
  verifyEndpoint?: string
  firebaseConfig?: FirebaseOptions
  initialCountry?: CountryCode
}

export default function Authx({ verifyEndpoint = '/api/auth/verify-id-token', firebaseConfig: firebaseConfigProp, initialCountry = 'GB' }: AuthxProps) {
  const firebaseConfig = useMemo<FirebaseOptions>(() => {
    if (firebaseConfigProp) return firebaseConfigProp
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!apiKey || !authDomain || !projectId) {
      throw new Error('Authx: Missing Firebase env (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID) or provide firebaseConfig prop')
    }
    return { apiKey, authDomain, projectId }
  }, [firebaseConfigProp])

  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [localPhone, setLocalPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'done'>('phone')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')

  type VerifyResponse = {
    ok: boolean
    uid?: string
    phoneNumber?: string | null
    email?: string | null
    supabaseUserId?: string
    error?: string
  }

  const { e164, valid } = toE164(country, localPhone)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const didAutoSendRef = useRef(false)

  useEffect(() => {
    ensureFirebase(firebaseConfig)
  }, [firebaseConfig])

  const otpValue = useMemo(() => otp.join(''), [otp])

  const ensureRecaptcha = useCallback(async () => {
    const auth = getAuth()
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'authx-recaptcha', { size: 'invisible' })
      await recaptchaRef.current.render()
    }
    return recaptchaRef.current
  }, [])

  const handleSend = useCallback(async () => {
    try {
      setSending(true)
      setError('')
      setStatus('Sending code via SMS…')

      const recaptcha = await ensureRecaptcha()
      const auth = getAuth()
      const confirmation = await signInWithPhoneNumber(auth, e164, recaptcha!)
      confirmationRef.current = confirmation
      setStatus('Code sent. Check your phone.')
      setStep('otp')
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to send code')
      setStatus('')
    } finally {
      setSending(false)
    }
  }, [e164, ensureRecaptcha])

  const handleVerify = useCallback(async () => {
    try {
      if (otpValue.length !== 6) return
      if (!confirmationRef.current) {
        setError('No confirmation in memory. Please resend the code.')
        return
      }
      setSending(true)
      setError('')
      setStatus('Verifying code…')

      const { user } = await confirmationRef.current.confirm(otpValue)
      const idToken = await user.getIdToken(true)

      setStatus('Verifying with server…')
      const res = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const json = (await res.json().catch(() => ({}))) as Partial<VerifyResponse>
      if (json && json.ok) {
        setStatus('Verified ✓')
        setStep('done')
      } else {
        setError((json && json.error) || `Server rejected (${res.status})`)
        setStatus('')
      }
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : typeof e === 'string' ? e : 'Verification failed')
      setStatus('')
    } finally {
      setSending(false)
    }
  }, [otpValue, verifyEndpoint])

  // Auto-send when valid
  useEffect(() => {
    if (step !== 'phone') return
    if (valid && !didAutoSendRef.current) {
      didAutoSendRef.current = true
      void handleSend()
    }
  }, [valid, step, handleSend])

  // Auto-verify when 6 digits
  useEffect(() => {
    if (otpValue.length === 6) void handleVerify()
  }, [otpValue, handleVerify])

  function onOtpChange(idx: number, value: string) {
    const d = value.replace(/\D/g, '')
  setOtp((prev: string[]) => {
      const next = [...prev]
      next[idx] = d.slice(0, 1)
      return next
    })
    const nextEl = document.querySelector<HTMLInputElement>(`#authx-otp-${idx + 1}`)
    if (d && nextEl) nextEl.focus()
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {step === 'phone' && (
        <div style={card}>
          <label style={label}>Phone Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={countryBox}>
              <span style={{ marginRight: 6 }}>{COUNTRIES[country].flag}</span>
              <select
                aria-label='Country'
                value={country}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value as CountryCode)}
                style={selectStyle}
              >
                {Object.entries(COUNTRIES).map(([code, { name, dial }]) => (
                  <option key={code} value={code}>
                    {name} ({dial})
                  </option>
                ))}
              </select>
              <span style={{ marginLeft: 6, color: '#111827', fontWeight: 600 }}>{COUNTRIES[country].dial}</span>
            </div>
            <input
              type='tel'
              placeholder='Enter your phone number'
              value={localPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalPhone(e.target.value)}
              disabled={sending}
              style={inputStyle}
            />
          </div>
          <button
            type='button'
            onClick={handleSend}
            disabled={!valid || sending}
            style={{ ...buttonStyle, opacity: !valid || sending ? 0.6 : 1 }}
          >
            Send Verification Code
          </button>
          {!!error && <div style={errorBox}>{error}</div>}
          {!!status && <div style={statusBox}>{status}</div>}
          <div id='authx-recaptcha' />
        </div>
      )}

      {step === 'otp' && (
        <div style={card}>
          <label style={label}>Enter 6-digit code</label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {otp.map((d, i) => (
              <input
                key={i}
                id={`authx-otp-${i}`}
                inputMode='numeric'
                maxLength={1}
                value={d}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onOtpChange(i, e.target.value)}
                style={otpInput}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <button
            type='button'
            onClick={handleVerify}
            disabled={sending || otpValue.length !== 6}
            style={{ ...buttonStyle, backgroundColor: '#16a34a' }}
          >
            Verify
          </button>
          {!!error && <div style={errorBox}>{error}</div>}
          {!!status && <div style={statusBox}>{status}</div>}
        </div>
      )}

      {step === 'done' && <div style={card}>Phone verified successfully.</div>}
    </div>
  )
}

// Styles
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'grid', gap: 12 }
const label: React.CSSProperties = { fontSize: 14, color: '#374151', fontWeight: 600 }
const countryBox: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 12, border: '1px solid #e5e7eb', height: 48, background: '#f9fafb' }
const selectStyle: React.CSSProperties = { border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }
const inputStyle: React.CSSProperties = { flex: 1, height: 48, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14 }
const buttonStyle: React.CSSProperties = { height: 48, backgroundColor: '#2563eb', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }
const otpInput: React.CSSProperties = { width: 48, height: 56, textAlign: 'center', fontSize: 20, border: '1px solid #e5e7eb', borderRadius: 12 }
const errorBox: React.CSSProperties = { padding: '8px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13 }
const statusBox: React.CSSProperties = { padding: '8px 12px', background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: 12, fontSize: 13 }
