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

export { COUNTRIES }

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
  hideCountryNames?: boolean
}

// Phase 2 Enhancement Types
export type LayoutVariant = 'vertical' | 'horizontal' | 'compact'
export type CountryPosition = 'left' | 'top' | 'separate'
export type ButtonPosition = 'bottom' | 'inline' | 'floating'

export type ComponentStyles = {
  inputStyle?: React.CSSProperties
  buttonStyle?: React.CSSProperties
  cardStyle?: React.CSSProperties
  countryBoxStyle?: React.CSSProperties
  otpInputStyle?: React.CSSProperties
}

export type CSSVariables = {
  [key: string]: string
}

export type ValidationConfig = {
  showValidation?: boolean
  validationStyle?: 'inline' | 'tooltip' | 'modal'
  loadingSpinner?: React.ReactNode
  successIcon?: React.ReactNode
  errorIcon?: React.ReactNode
}

// Phase 3: Animation & Responsive Types
export type AnimationDuration = '150ms' | '200ms' | '250ms' | '300ms' | '400ms' | '500ms' | string

export type AnimationEasing = 
  | 'ease' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'cubic-bezier(0.4, 0, 0.2, 1)' 
  | 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  | string

export type SlideDirection = 'up' | 'down' | 'left' | 'right' | 'none'

export type AnimationConfig = {
  enabled?: boolean
  duration?: AnimationDuration
  easing?: AnimationEasing
  slideDirection?: SlideDirection
  fadeIn?: boolean
  scaleIn?: boolean
  staggerDelay?: number
}

export type BreakpointConfig = {
  size?: SizeVariant
  layout?: LayoutVariant
  width?: string
  padding?: string
}

export type ResponsiveConfig = {
  mobile?: BreakpointConfig
  tablet?: BreakpointConfig  
  desktop?: BreakpointConfig
  breakpoints?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export type AccessibilityConfig = {
  ariaLabel?: string
  focusManagement?: boolean
  announceSteps?: boolean
  keyboardNavigation?: boolean
  reducedMotion?: boolean
  highContrast?: boolean
}

// Phase 4: Advanced Design System Types
export type ShadowVariant = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner'

export type ElevationConfig = {
  level?: number
  color?: string
  blur?: number
  spread?: number
  x?: number
  y?: number
}

export type FontConfig = {
  family?: string
  weight?: number | string
  size?: string
  lineHeight?: string
  letterSpacing?: string
  fallback?: string[]
}

export type TypographyConfig = {
  heading?: FontConfig
  body?: FontConfig
  label?: FontConfig
  button?: FontConfig
  caption?: FontConfig
}

export type GradientVariant = 'linear' | 'radial' | 'conic'

export type GradientStop = {
  color: string
  position?: string
}

export type GradientConfig = {
  variant?: GradientVariant
  direction?: string
  stops?: GradientStop[]
  angle?: string | number
}

export type GradientSystem = {
  background?: GradientConfig | string
  button?: GradientConfig | string
  card?: GradientConfig | string
  overlay?: GradientConfig | string
}

function ensureFirebase(config: FirebaseOptions) {
  if (!getApps().length) initializeApp(config)
}

function isValidE164(e164: string) {
  return /^\+\d{10,15}$/.test(e164)
}

function toE164(country: CountryCode, local: string, countries: Record<string, { name: string; dial: string; flag: string; min: number; max: number }> = COUNTRIES) {
  const countryInfo = countries[country]
  if (!countryInfo) {
    // Fallback to default countries if country not found
    const fallbackInfo = COUNTRIES[country as keyof typeof COUNTRIES]
    if (!fallbackInfo) return { e164: '', valid: false }
    const { dial, min, max } = fallbackInfo
    const digits = local.replace(/\D/g, '')
    const e164 = `${dial}${digits}`
    const valid = digits.length >= min && digits.length <= max && isValidE164(e164)
    return { e164, valid }
  }
  const { dial, min, max } = countryInfo
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
  countries?: Record<string, { name: string; dial: string; flag: string; min: number; max: number }>
  
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
  
  // Phase 2: Component Styling Props
  inputStyle?: React.CSSProperties
  buttonStyle?: React.CSSProperties
  cardStyle?: React.CSSProperties
  countryBoxStyle?: React.CSSProperties
  otpInputStyle?: React.CSSProperties
  
  // Phase 2: Layout Variants
  layout?: LayoutVariant
  countryPosition?: CountryPosition
  buttonPosition?: ButtonPosition
  
  // Phase 2: CSS Variables Integration
  cssVariables?: CSSVariables
  
  // Phase 2: Validation & Feedback
  validation?: ValidationConfig
  
  // Phase 3: Animation System
  animations?: AnimationConfig
  
  // Phase 3: Responsive Design
  responsive?: ResponsiveConfig
  
  // Phase 3: Accessibility Features
  a11y?: AccessibilityConfig
  
  // Phase 4: Advanced Design System
  shadow?: ShadowVariant
  elevation?: ElevationConfig
  fontFamily?: string
  typography?: TypographyConfig
  gradient?: GradientSystem
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

// Phase 2 Helper Functions
function getLayoutConfig(layout: LayoutVariant, countryPosition: CountryPosition, buttonPosition: ButtonPosition) {
  return {
    isHorizontal: layout === 'horizontal',
    isCompact: layout === 'compact',
    countryOnTop: countryPosition === 'top',
    countrySeparate: countryPosition === 'separate',
    buttonInline: buttonPosition === 'inline',
    buttonFloating: buttonPosition === 'floating'
  }
}

function mergeCSSVariables(cssVariables?: CSSVariables): React.CSSProperties {
  if (!cssVariables) return {}
  
  const cssVarStyles: any = {}
  Object.entries(cssVariables).forEach(([key, value]) => {
    const cssVarKey = key.startsWith('--') ? key : `--${key}`
    cssVarStyles[cssVarKey] = value
  })
  
  return cssVarStyles as React.CSSProperties
}

function mergeComponentStyles(
  baseStyle: React.CSSProperties,
  enhancedStyle: React.CSSProperties,
  userStyle?: React.CSSProperties
): React.CSSProperties {
  return {
    ...baseStyle,
    ...enhancedStyle,
    ...(userStyle || {})
  }
}

// Phase 3: Animation & Responsive Helper Functions
function getAnimationStyles(animations?: AnimationConfig): React.CSSProperties {
  if (!animations || !animations.enabled) return {}
  
  const duration = animations.duration || '300ms'
  const easing = animations.easing || 'cubic-bezier(0.4, 0, 0.2, 1)'
  
  let transform = ''
  let opacity = animations.fadeIn ? '0' : '1'
  
  if (animations.scaleIn) {
    transform += 'scale(0.95) '
  }
  
  if (animations.slideDirection && animations.slideDirection !== 'none') {
    const directions = {
      up: 'translateY(10px)',
      down: 'translateY(-10px)',
      left: 'translateX(10px)',
      right: 'translateX(-10px)'
    }
    transform += directions[animations.slideDirection] || ''
  }

  return {
    transition: `all ${duration} ${easing}`,
    transform: transform.trim() || undefined,
    opacity,
    animation: animations.fadeIn ? `authx-fade-in ${duration} ${easing} forwards` : undefined
  }
}

function getResponsiveStyles(responsive?: ResponsiveConfig): React.CSSProperties {
  if (!responsive) return {}
  
  // Use CSS custom properties for responsive behavior
  const breakpoints = responsive.breakpoints || {
    mobile: '480px',
    tablet: '768px', 
    desktop: '1024px'
  }
  
  const styles: any = {}
  
  // Set CSS custom properties for responsive values
  if (responsive.mobile) {
    styles['--authx-mobile-size'] = responsive.mobile.size || 'sm'
    styles['--authx-mobile-width'] = responsive.mobile.width || '100%'
  }
  
  if (responsive.tablet) {
    styles['--authx-tablet-size'] = responsive.tablet.size || 'md' 
    styles['--authx-tablet-width'] = responsive.tablet.width || '400px'
  }
  
  if (responsive.desktop) {
    styles['--authx-desktop-size'] = responsive.desktop.size || 'lg'
    styles['--authx-desktop-width'] = responsive.desktop.width || '480px'
  }
  
  return styles as React.CSSProperties
}

function getAccessibilityProps(a11y?: AccessibilityConfig) {
  if (!a11y) return {}
  
  const props: any = {}
  
  if (a11y.ariaLabel) {
    props['aria-label'] = a11y.ariaLabel
  }
  
  if (a11y.focusManagement) {
    props['aria-live'] = 'polite'
    props['role'] = 'form'
  }
  
  if (a11y.reducedMotion) {
    props['data-reduced-motion'] = 'true'
  }
  
  if (a11y.highContrast) {
    props['data-high-contrast'] = 'true'
  }
  
  return props
}

// Phase 4: Advanced Design System Helper Functions
function getShadowStyles(shadow?: ShadowVariant, elevation?: ElevationConfig): React.CSSProperties {
  if (!shadow || shadow === 'none') return {}
  
  // Predefined shadow variants based on modern design systems
  const shadows = {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  }
  
  let boxShadow = shadows[shadow as keyof typeof shadows] || shadows.md
  
  // Custom elevation overrides
  if (elevation) {
    const {
      level = 1,
      color = 'rgb(0 0 0 / 0.1)',
      blur = 6,
      spread = 0,
      x = 0,
      y = level * 2
    } = elevation
    
    boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`
  }
  
  return { boxShadow }
}

function getFontStyles(fontFamily?: string, typography?: TypographyConfig): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  if (fontFamily) {
    styles.fontFamily = fontFamily
  }
  
  if (typography?.body) {
    const { family, weight, size, lineHeight, letterSpacing } = typography.body
    if (family) styles.fontFamily = family
    if (weight) styles.fontWeight = weight
    if (size) styles.fontSize = size
    if (lineHeight) styles.lineHeight = lineHeight
    if (letterSpacing) styles.letterSpacing = letterSpacing
  }
  
  return styles
}

function getGradientStyles(gradients?: GradientSystem): { [key: string]: React.CSSProperties } {
  if (!gradients) return {}
  
  const styles: { [key: string]: React.CSSProperties } = {}
  
  const createGradientCSS = (gradient: GradientConfig | string): string => {
    if (typeof gradient === 'string') return gradient
    
    const { variant = 'linear', direction = '135deg', stops = [], angle } = gradient
    
    if (!stops.length) return ''
    
    const stopStrings = stops.map(stop => 
      `${stop.color}${stop.position ? ` ${stop.position}` : ''}`
    ).join(', ')
    
    const gradientAngle = angle || direction
    
    switch (variant) {
      case 'radial':
        return `radial-gradient(circle, ${stopStrings})`
      case 'conic':
        return `conic-gradient(from ${gradientAngle}, ${stopStrings})`
      default:
        return `linear-gradient(${gradientAngle}, ${stopStrings})`
    }
  }
  
  if (gradients.background) {
    styles.background = { background: createGradientCSS(gradients.background) }
  }
  
  if (gradients.button) {
    styles.button = { background: createGradientCSS(gradients.button) }
  }
  
  if (gradients.card) {
    styles.card = { background: createGradientCSS(gradients.card) }
  }
  
  if (gradients.overlay) {
    styles.overlay = { background: createGradientCSS(gradients.overlay) }
  }
  
  return styles
}

function loadCustomFont(fontFamily: string, fallbacks: string[] = []): void {
  // Check if font is already loaded
  if (document.fonts && document.fonts.check) {
    const isLoaded = document.fonts.check(`12px ${fontFamily}`)
    if (isLoaded) return
  }
  
  // Create fallback font stack
  const fontStack = [fontFamily, ...fallbacks, 'sans-serif'].join(', ')
  
  // Apply font to document for loading
  const style = document.createElement('style')
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap');
    .authx-font-loading { font-family: ${fontStack}; }
  `
  document.head.appendChild(style)
}

export default function Authx({ 
  // Existing props (unchanged)
  verifyEndpoint = '/api/auth/verify-id-token', 
  firebaseConfig: firebaseConfigProp, 
  initialCountry = 'GB',
  countries,
  
  // Phase 1 props
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
  visibility = { showLabels: true, showFlags: true, showDialCode: true },
  
  // Phase 2 props
  inputStyle,
  buttonStyle,
  cardStyle: cardStyleProp,
  countryBoxStyle: countryBoxStyleProp,
  otpInputStyle: otpInputStyleProp,
  layout = 'vertical',
  countryPosition = 'left',
  buttonPosition = 'bottom',
  cssVariables,
  validation,
  
  // Phase 3 props
  animations,
  responsive,
  a11y,
  
  // Phase 4 props
  shadow,
  elevation,
  fontFamily,
  typography,
  gradient
}: AuthxProps) {
  // Use provided countries or default COUNTRIES
  const countriesConfig = countries || COUNTRIES;
  
  // Phase 1: Compute enhanced styles (before any existing logic)
  const themeColors = getThemeColors(theme, colorScheme)
  const sizeConfig = getSizeConfig(size)
  const customLabels = getCustomLabels(labels)
  const enhancedStyles = getEnhancedStyles(themeColors, sizeConfig, width, borderRadius, padding)
  
  // Phase 2: Compute layout and component styles
  const layoutConfig = getLayoutConfig(layout, countryPosition, buttonPosition)
  const cssVarStyles = mergeCSSVariables(cssVariables)
  
  // Create final merged styles (will be used after original styles are defined)
  
  // Destructure enhanced styles for backward compatibility
  const {
    cardStyle: _cardStyle,
    labelStyle,
    countryBoxStyle: _countryBoxStyle,
    inputStyleEnhanced: _inputStyleEnhanced,
    buttonStyleEnhanced: _buttonStyleEnhanced,
    otpInputStyle: _otpInputStyle,
    errorBoxStyle: _errorBoxStyle,
    statusBoxStyle: _statusBoxStyle
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

  const { e164, valid } = toE164(country, localPhone, countriesConfig)
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

  // Phase 2: Compute final merged styles (after original styles are available)
  const finalCardStyle = mergeComponentStyles(defaultCard, _cardStyle, cardStyleProp)
  const finalInputStyle = mergeComponentStyles(defaultInputStyle, _inputStyleEnhanced, inputStyle)
  const finalButtonStyle = mergeComponentStyles(defaultButtonStyle, _buttonStyleEnhanced, buttonStyle)  
  const finalCountryBoxStyle = mergeComponentStyles(countryBox, _countryBoxStyle, countryBoxStyleProp)
  const finalOtpInputStyle = mergeComponentStyles(otpInput, _otpInputStyle, otpInputStyleProp)
  const finalErrorBoxStyle = mergeComponentStyles(errorBox, _errorBoxStyle, {})
  const finalStatusBoxStyle = mergeComponentStyles(statusBox, _statusBoxStyle, {})

  // Phase 3: Compute animation, responsive, and accessibility enhancements
  const animationStyles = getAnimationStyles(animations)
  const responsiveStyles = getResponsiveStyles(responsive)
  const accessibilityProps = getAccessibilityProps(a11y)

  // Phase 4: Compute advanced design system enhancements
  const shadowStyles = getShadowStyles(shadow, elevation)
  const fontStyles = getFontStyles(fontFamily, typography)
  const gradientStyles = getGradientStyles(gradient)
  
  // Load custom font if specified
  React.useEffect(() => {
    if (fontFamily && typeof document !== 'undefined') {
      loadCustomFont(fontFamily, typography?.body?.fallback)
    }
  }, [fontFamily, typography])

  // Merge all styles for the container
  const containerStyle = {
    maxWidth: width || 420, 
    margin: '0 auto', 
    fontFamily: fontFamily || 'Inter, system-ui, sans-serif',
    ...responsiveStyles,
    ...cssVarStyles,
    ...animationStyles,
    ...shadowStyles,
    ...fontStyles,
    ...(gradientStyles.background || {})
  }
  
  // Enhanced component styles with gradients
  const enhancedFinalCardStyle = {
    ...finalCardStyle,
    ...(gradientStyles.card || {})
  }
  
  const enhancedFinalButtonStyle = {
    ...finalButtonStyle,
    ...(gradientStyles.button || {})
  }

  return (
    <>
      {animations?.enabled && (
        <style>
          {`
            @keyframes authx-fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @media (prefers-reduced-motion: reduce) {
              .authx-container * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
            
            @media (max-width: 480px) {
              .authx-container {
                width: var(--authx-mobile-width, 100%) !important;
                max-width: 100% !important;
                padding: 12px !important;
              }
            }
            
            @media (min-width: 481px) and (max-width: 768px) {
              .authx-container {
                width: var(--authx-tablet-width, 400px) !important;
              }
            }
            
            @media (min-width: 769px) {
              .authx-container {
                width: var(--authx-desktop-width, 480px) !important;
              }
            }
          `}
        </style>
      )}
      <div 
        className={`authx-container ${className || ''}`}
        style={{
          ...containerStyle,
          ...(padding && { padding }),
          ...(borderRadius && { borderRadius })
        }}
        {...accessibilityProps}
      >
        {step === 'phone' && (
        <div style={enhancedFinalCardStyle} className={cardClassName}>
          {visibility.showLabels && (
            <label style={{...label, ...labelStyle}} className={labelClassName}>
              {customLabels.phoneNumber}
            </label>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={finalCountryBoxStyle}>
              {visibility.showFlags && (
                <span style={{ marginRight: 6 }}>{countriesConfig[country].flag}</span>
              )}
              <select
                aria-label='Country'
                value={country}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value as CountryCode)}
                style={selectStyle}
              >
                {Object.entries(countriesConfig).map(([code, { name, dial }]) => (
                  <option key={code} value={code}>
                    {visibility.hideCountryNames ? dial : `${name} (${dial})`}
                  </option>
                ))}
              </select>
              {visibility.showDialCode && (
                <span style={{ marginLeft: 6, color: themeColors.text, fontWeight: 600 }}>
                  {countriesConfig[country].dial}
                </span>
              )}
            </div>
            <input
              type='tel'
              placeholder={customLabels.placeholder}
              value={localPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalPhone(e.target.value)}
              disabled={sending}
              style={finalInputStyle}
              className={inputClassName}
            />
          </div>
          <button
            type='button'
            onClick={handleSend}
            disabled={!valid || sending}
            style={{ ...enhancedFinalButtonStyle, opacity: !valid || sending ? 0.6 : 1 }}
            className={buttonClassName}
          >
            {customLabels.sendCode}
          </button>
          {!!error && <div style={finalErrorBoxStyle}>{error}</div>}
          {!!status && <div style={finalStatusBoxStyle}>{status}</div>}
          <div id='authx-recaptcha' />
        </div>
      )}

      {step === 'otp' && (
        <div style={enhancedFinalCardStyle} className={cardClassName}>
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
                style={finalOtpInputStyle}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <button
            type='button'
            onClick={handleVerify}
            disabled={sending || otpValue.length !== 6}
            style={{ ...enhancedFinalButtonStyle, backgroundColor: themeColors.success }}
            className={buttonClassName}
          >
            {customLabels.verify}
          </button>
          {!!error && <div style={finalErrorBoxStyle}>{error}</div>}
          {!!status && <div style={finalStatusBoxStyle}>{status}</div>}
        </div>
      )}

      {step === 'done' && <div style={enhancedFinalCardStyle} className={cardClassName}>Phone verified successfully.</div>}
      </div>
    </>
  )
}

// Original styles (preserved exactly)
const defaultCard: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'grid', gap: 12 }
const label: React.CSSProperties = { fontSize: 14, color: '#374151', fontWeight: 600 }
const countryBox: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 12, border: '1px solid #e5e7eb', height: 48, background: '#f9fafb' }
const selectStyle: React.CSSProperties = { border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }
const defaultInputStyle: React.CSSProperties = { flex: 1, height: 48, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14 }
const defaultButtonStyle: React.CSSProperties = { height: 48, backgroundColor: '#2563eb', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }
const otpInput: React.CSSProperties = { width: 48, height: 56, textAlign: 'center', fontSize: 20, border: '1px solid #e5e7eb', borderRadius: 12 }
const errorBox: React.CSSProperties = { padding: '8px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13 }
const statusBox: React.CSSProperties = { padding: '8px 12px', background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: 12, fontSize: 13 }
