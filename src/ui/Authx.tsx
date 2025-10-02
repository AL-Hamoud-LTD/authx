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

// Phase 1 Enhancement Types
export type ThemeType = 'light' | 'dark' | 'custom'

export type ColorScheme = {
  primary?: string
  secondary?: string
  background?: string
  text?: string
  border?: string
  error?: string
  success?: string
}

export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl'

export type CustomLabels = {
  phoneNumber?: string
  sendCode?: string
  enterCode?: string
  verify?: string
  placeholder?: string
}

export type VisibilityControls = {
  showLabels?: boolean
  showFlags?: boolean
  showDialCode?: boolean
}

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
  // Existing props (unchanged)
  verifyEndpoint?: string
  firebaseConfig?: FirebaseOptions
  initialCountry?: CountryCode
  
  // Phase 1: Theme System
  theme?: ThemeType
  colorScheme?: ColorScheme
  
  // Phase 1: CSS Classes Support
  className?: string
  cardClassName?: string
  inputClassName?: string
  buttonClassName?: string
  labelClassName?: string
  
  // Phase 1: Size Variants
  size?: SizeVariant
  width?: string
  borderRadius?: string
  padding?: string
  
  // Phase 1: Text Customization
  labels?: CustomLabels
  visibility?: VisibilityControls
}

// Helper functions for Phase 1 enhancements
function getThemeColors(theme: ThemeType = 'light', colorScheme?: ColorScheme): Required<ColorScheme> {
  const baseColors = {
    light: {
      primary: '#2563eb',
      secondary: '#f3f4f6',
      background: '#ffffff',
      text: '#111827',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#10b981'
    },
    dark: {
      primary: '#3b82f6',
      secondary: '#374151',
      background: '#1f2937',
      text: '#f9fafb',
      border: '#4b5563',
      error: '#f87171',
      success: '#34d399'
    },
    custom: {
      primary: '#2563eb',
      secondary: '#f3f4f6',
      background: '#ffffff',
      text: '#111827',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#10b981'
    }
  }
  
  return {
    ...baseColors[theme],
    ...colorScheme
  }
}

function getSizeConfig(size: SizeVariant = 'md') {
  const configs = {
    sm: { padding: '12px', borderRadius: '8px', fontSize: '13px', height: 40 },
    md: { padding: '16px', borderRadius: '12px', fontSize: '14px', height: 48 },
    lg: { padding: '20px', borderRadius: '16px', fontSize: '16px', height: 56 },
    xl: { padding: '24px', borderRadius: '20px', fontSize: '18px', height: 64 }
  }
  return configs[size]
}

function getCustomLabels(labels?: CustomLabels): Required<CustomLabels> {
  return {
    phoneNumber: 'Phone Number',
    sendCode: 'Send Verification Code',
    enterCode: 'Enter 6-digit code',
    verify: 'Verify',
    placeholder: 'Enter your phone number',
    ...labels
  }
}

function getEnhancedStyles(themeColors: Required<ColorScheme>, sizeConfig: any, customWidth?: string, customBorderRadius?: string, customPadding?: string) {
  return {
    cardStyle: {
      background: themeColors.background,
      borderColor: themeColors.border,
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius),
      padding: customPadding || sizeConfig.padding,
      color: themeColors.text
    },
    labelStyle: {
      color: themeColors.text,
      fontSize: sizeConfig.fontSize
    },
    countryBoxStyle: {
      borderColor: themeColors.border,
      backgroundColor: themeColors.secondary,
      height: sizeConfig.height,
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius)
    },
    inputStyleEnhanced: {
      height: sizeConfig.height,
      borderColor: themeColors.border,
      color: themeColors.text,
      fontSize: sizeConfig.fontSize,
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius),
      backgroundColor: themeColors.background
    },
    buttonStyleEnhanced: {
      height: sizeConfig.height,
      backgroundColor: themeColors.primary,
      color: themeColors.background,
      fontSize: sizeConfig.fontSize,
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius)
    },
    otpInputStyle: {
      borderColor: themeColors.border,
      color: themeColors.text,
      backgroundColor: themeColors.background,
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius)
    },
    errorBoxStyle: {
      backgroundColor: themeColors.error + '20',
      color: themeColors.error,
      borderColor: themeColors.error + '40',
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius)
    },
    statusBoxStyle: {
      backgroundColor: themeColors.primary + '20',
      color: themeColors.primary,
      borderColor: themeColors.primary + '40',
      borderRadius: customBorderRadius ? parseInt(customBorderRadius) : parseInt(sizeConfig.borderRadius)
    }
  }
}

export default function Authx({ 
  // Existing props (unchanged)
  verifyEndpoint = '/api/auth/verify-id-token', 
  firebaseConfig: firebaseConfigProp, 
  initialCountry = 'GB',
  
  // Phase 1 new props
  theme = 'light',
  colorScheme,
  className,
  cardClassName,
  inputClassName,
  buttonClassName,
  labelClassName,
  size = 'md',
  width,
  borderRadius,
  padding,
  labels,
  visibility = { showLabels: true, showFlags: true, showDialCode: true }
}: AuthxProps) {
  // Phase 1: Compute enhanced styles (before any existing logic)
  const themeColors = getThemeColors(theme, colorScheme)
  const sizeConfig = getSizeConfig(size)
  const customLabels = getCustomLabels(labels)
  const enhancedStyles = getEnhancedStyles(themeColors, sizeConfig, width, borderRadius, padding)
  
  // Destructure enhanced styles for easier use
  const {
    cardStyle,
    labelStyle,
    countryBoxStyle,
    inputStyleEnhanced,
    buttonStyleEnhanced,
    otpInputStyle,
    errorBoxStyle,
    statusBoxStyle
  } = enhancedStyles
  
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
    <div 
      className={className}
      style={{ 
        maxWidth: width || 420, 
        margin: '0 auto', 
        fontFamily: 'Inter, system-ui, sans-serif',
        ...(padding && { padding }),
        ...(borderRadius && { borderRadius })
      }}
    >
      {step === 'phone' && (
        <div style={{...card, ...cardStyle}} className={cardClassName}>
          {visibility.showLabels && (
            <label style={{...label, ...labelStyle}} className={labelClassName}>
              {customLabels.phoneNumber}
            </label>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{...countryBox, ...countryBoxStyle}}>
              {visibility.showFlags && (
                <span style={{ marginRight: 6 }}>{COUNTRIES[country].flag}</span>
              )}
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
              {visibility.showDialCode && (
                <span style={{ marginLeft: 6, color: themeColors.text, fontWeight: 600 }}>
                  {COUNTRIES[country].dial}
                </span>
              )}
            </div>
            <input
              type='tel'
              placeholder={customLabels.placeholder}
              value={localPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalPhone(e.target.value)}
              disabled={sending}
              style={{...inputStyle, ...inputStyleEnhanced}}
              className={inputClassName}
            />
          </div>
          <button
            type='button'
            onClick={handleSend}
            disabled={!valid || sending}
            style={{ ...buttonStyle, ...buttonStyleEnhanced, opacity: !valid || sending ? 0.6 : 1 }}
            className={buttonClassName}
          >
            {customLabels.sendCode}
          </button>
          {!!error && <div style={{...errorBox, ...errorBoxStyle}}>{error}</div>}
          {!!status && <div style={{...statusBox, ...statusBoxStyle}}>{status}</div>}
          <div id='authx-recaptcha' />
        </div>
      )}

      {step === 'otp' && (
        <div style={{...card, ...cardStyle}} className={cardClassName}>
          {visibility.showLabels && (
            <label style={{...label, ...labelStyle}} className={labelClassName}>
              {customLabels.enterCode}
            </label>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {otp.map((d, i) => (
              <input
                key={i}
                id={`authx-otp-${i}`}
                inputMode='numeric'
                maxLength={1}
                value={d}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onOtpChange(i, e.target.value)}
                style={{...otpInput, ...otpInputStyle}}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <button
            type='button'
            onClick={handleVerify}
            disabled={sending || otpValue.length !== 6}
            style={{ ...buttonStyle, ...buttonStyleEnhanced, backgroundColor: themeColors.success }}
            className={buttonClassName}
          >
            {customLabels.verify}
          </button>
          {!!error && <div style={{...errorBox, ...errorBoxStyle}}>{error}</div>}
          {!!status && <div style={{...statusBox, ...statusBoxStyle}}>{status}</div>}
        </div>
      )}

      {step === 'done' && <div style={{...card, ...cardStyle}} className={cardClassName}>Phone verified successfully.</div>}
    </div>
  )
}

// Original styles (preserved exactly)
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'grid', gap: 12 }
const label: React.CSSProperties = { fontSize: 14, color: '#374151', fontWeight: 600 }
const countryBox: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 12, border: '1px solid #e5e7eb', height: 48, background: '#f9fafb' }
const selectStyle: React.CSSProperties = { border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }
const inputStyle: React.CSSProperties = { flex: 1, height: 48, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14 }
const buttonStyle: React.CSSProperties = { height: 48, backgroundColor: '#2563eb', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }
const otpInput: React.CSSProperties = { width: 48, height: 56, textAlign: 'center', fontSize: 20, border: '1px solid #e5e7eb', borderRadius: 12 }
const errorBox: React.CSSProperties = { padding: '8px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13 }
const statusBox: React.CSSProperties = { padding: '8px 12px', background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: 12, fontSize: 13 }
