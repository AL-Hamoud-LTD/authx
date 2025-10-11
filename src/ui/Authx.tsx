"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import './Authx.css'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

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
  // Try robust parsing first (handles either E.164 like +44... or national like 079...)
  try {
    const parsed = parsePhoneNumberFromString(local, country)
    if (parsed) {
      return { e164: parsed.number, valid: parsed.isValid() }
    }
  } catch {}
  // Fallback to previous logic with basic duplication guard
  const countryInfo = countries[country]
  const info = countryInfo || COUNTRIES[country as keyof typeof COUNTRIES]
  if (!info) return { e164: '', valid: false }
  const dial = info.dial // e.g. +44
  const dialDigits = dial.replace('+', '')
  let digits = local.replace(/\D/g, '')
  // Remove duplicated country code if user/autofill provided it
  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length)
  }
  const e164 = `${dial}${digits}`
  const valid = isValidE164(e164)
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

  // Focus management
  autoFocusPhone?: boolean
  autoFocusOtp?: boolean
  // Hints
  enablePhoneHint?: boolean
  enableWebOtp?: boolean
  // Phone entry helpers
  enableContactPicker?: boolean
  phoneAutocomplete?: 'tel' | 'tel-national' | 'tel-local' | string
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
  ,
  // Focus props
  autoFocusPhone = false,
  autoFocusOtp = false,
  // Hint props
  enablePhoneHint = true,
  enableWebOtp = true,
  enableContactPicker = true,
  phoneAutocomplete = 'tel'
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
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const didAutoSendRef = useRef(false)
  const phoneInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    ensureFirebase(firebaseConfig)
  }, [firebaseConfig])

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear()
        } catch (e) {
          console.warn('Failed to clear reCAPTCHA on unmount:', e)
        }
        recaptchaRef.current = null
      }
    }
  }, [])

  const otpValue = useMemo(() => otp.join(''), [otp])
  // Contact Picker (progressive enhancement)
  const contactPickerAvailable = useMemo(() => {
    return typeof navigator !== 'undefined' && (navigator as any).contacts && typeof (navigator as any).contacts.select === 'function'
  }, [])

  const handlePickContact = useCallback(async () => {
    try {
      const navAny = navigator as any
      if (!navAny?.contacts?.select) return
      const contacts = await navAny.contacts.select(['tel'], { multiple: false })
      if (contacts && contacts[0] && contacts[0].tel && contacts[0].tel[0]) {
        const picked: string = contacts[0].tel[0]
        // Attempt to parse and set country + local number
        try {
          const parsed = parsePhoneNumberFromString(picked)
          if (parsed) {
            const c = parsed.country as CountryCode | undefined
            if (c && COUNTRIES[c]) setCountry(c)
            setLocalPhone(parsed.nationalNumber || picked)
            return
          }
        } catch {}
        setLocalPhone(picked)
      }
    } catch (err) {
      console.warn('Contact pick cancelled or failed', err)
    }
  }, [])


  const ensureRecaptcha = useCallback(async () => {
    const auth = getAuth()
    // Return existing instance if already rendered
    if (recaptchaRef.current) {
      return recaptchaRef.current
    }
    // Ensure the container ref is attached to the DOM
    if (!recaptchaContainerRef.current) {
      // Wait for DOM to be ready with longer timeout
      await new Promise((r) => setTimeout(r, 100))
    }
    // Double-check after waiting
    if (!recaptchaContainerRef.current) {
      throw new Error('reCAPTCHA container not found in DOM. Please try again.')
    }
    if (!recaptchaRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber
            console.debug('reCAPTCHA solved:', response)
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again
            console.warn('reCAPTCHA expired, please try again')
            setError('Verification expired. Please try again.')
            // Don't clear immediately - let user retry with same instance
            recaptchaRef.current = null
          }
        })
        await recaptchaRef.current.render()
      } catch (error: any) {
        // If already rendered, just return existing instance
        if (error?.message?.includes('already been rendered')) {
          console.warn('reCAPTCHA already rendered, reusing instance')
          return recaptchaRef.current
        }
        throw error
      }
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
      // Just reset ref, don't clear DOM to avoid null errors
      recaptchaRef.current = null
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
        const errorMsg = json && json.error
          ? typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
          : `Server rejected (${res.status})`
        setError(errorMsg)
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
      // Add small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        void handleSend()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [valid, step, handleSend])

  // Auto-verify when 6 digits
  useEffect(() => {
    if (otpValue.length === 6) void handleVerify()
  }, [otpValue, handleVerify])

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      try {
        // clear() removes the widget and associated resources if present
        // Optional chaining in case different firebase versions vary
        // @ts-ignore - .clear may not be in typings for some versions
        recaptchaRef.current?.clear?.()
      } catch {}
      recaptchaRef.current = null
    }
  }, [])

  // Auto-focus phone input on phone step
  useEffect(() => {
    if (!autoFocusPhone) return
    if (step !== 'phone') return
    const t = window.setTimeout(() => {
      phoneInputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [step, autoFocusPhone])

  // Auto-focus first OTP box on otp step
  useEffect(() => {
    if (!autoFocusOtp) return
    if (step !== 'otp') return
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('#authx-otp-0')
      el?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [step, autoFocusOtp])

  // Web OTP progressive enhancement (fills OTP if available)
  useEffect(() => {
    if (!enableWebOtp) return
    if (step !== 'otp') return
    if (typeof window === 'undefined') return
    // @ts-ignore: OTPCredential may be experimental
    if (!('OTPCredential' in window) || !navigator.credentials) return
    const ac = new AbortController()
    ;(async () => {
      try {
        // @ts-ignore: experimental otp option
        const cred = await navigator.credentials.get({
          // @ts-ignore: experimental otp option
          otp: { transport: ['sms'] },
          signal: ac.signal
        })
        // @ts-ignore: cred may include .code
        const code: string | undefined = cred && 'code' in (cred as any) ? (cred as any).code : undefined
        if (code && typeof code === 'string') {
          const digits = code.replace(/\D/g, '').slice(0, 6).split('')
          if (digits.length === 6) {
            setOtp(digits as string[])
          }
        }
      } catch {}
    })()
    return () => ac.abort()
  }, [enableWebOtp, step])

  function onOtpChange(idx: number, value: string) {
    const digits = value.replace(/\D/g, '')
    setOtp((prev: string[]) => {
      const next = [...prev]
      if (digits.length <= 1) {
        next[idx] = digits
      } else {
        // Distribute across boxes when multiple digits arrive (e.g., iOS AutoFill)
        for (let i = 0; i < digits.length && idx + i < 6; i++) {
          next[idx + i] = digits.charAt(i)
        }
      }
      return next
    })
    // Move focus appropriately
    if (digits.length > 1) {
      const target = Math.min(idx + digits.length, 5)
      const el = document.querySelector<HTMLInputElement>(`#authx-otp-${target}`)
      el?.focus()
    } else if (digits.length === 1) {
      const el = document.querySelector<HTMLInputElement>(`#authx-otp-${idx + 1}`)
      el?.focus()
    }
  }

  function onOtpPaste(idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData?.getData('text') || ''
    const digits = text.replace(/\D/g, '')
    if (!digits) return
    e.preventDefault()
    setOtp((prev) => {
      const next = [...prev]
      for (let i = 0; i < Math.min(6 - idx, digits.length); i++) {
        next[idx + i] = digits.charAt(i)
      }
      return next
    })
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
    ...responsiveStyles,
    ...cssVarStyles,
    ...shadowStyles,
    ...fontStyles,
    ...(gradientStyles.background || {}),
    // Add error/status box CSS variables for dynamic theming
    '--authx-error-bg': finalErrorBoxStyle.backgroundColor || '#fef2f2',
    '--authx-error-text': finalErrorBoxStyle.color || '#991b1b',
    '--authx-error-border': finalErrorBoxStyle.borderColor || '#fecaca',
    '--authx-error-radius': finalErrorBoxStyle.borderRadius ? `${finalErrorBoxStyle.borderRadius}px` : '12px',
    '--authx-status-bg': finalStatusBoxStyle.backgroundColor || '#eff6ff',
    '--authx-status-text': finalStatusBoxStyle.color || '#1e3a8a',
    '--authx-status-border': finalStatusBoxStyle.borderColor || '#bfdbfe',
    '--authx-status-radius': finalStatusBoxStyle.borderRadius ? `${finalStatusBoxStyle.borderRadius}px` : '12px',
    // Add country box CSS variables for dynamic theming
    '--authx-country-bg': finalCountryBoxStyle.backgroundColor || '#f9fafb',
    '--authx-country-border': finalCountryBoxStyle.borderColor || '#e5e7eb',
    '--authx-country-height': finalCountryBoxStyle.height ? `${finalCountryBoxStyle.height}px` : '48px',
    '--authx-country-radius': finalCountryBoxStyle.borderRadius ? `${finalCountryBoxStyle.borderRadius}px` : '12px',
  } as React.CSSProperties
  
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
      {/* animations handled via CSS class authx-animations-enabled */}
      <div
        className={`authx-container ${animations?.enabled ? 'authx-animations-enabled' : ''} ${theme === 'dark' ? 'authx-theme-dark' : ''} ${className || ''}`}
        {...accessibilityProps}
      >
        {step === 'phone' && (
        <Card className={cn("bg-white dark:bg-slate-900", cardClassName)} style={finalCardStyle}>
          <CardContent className="space-y-3 pt-6">
          {visibility.showLabels && (
            <Label htmlFor="authx-phone" className={cn("text-sm font-semibold", labelClassName)} style={labelStyle}>
              {customLabels.phoneNumber}
            </Label>
          )}
          <div className="flex gap-2">
            <div className={cn("authx-country-box", "flex items-center px-2 rounded-xl border bg-secondary/50 h-12 min-w-fit")}>
              {visibility.showFlags && (
                <span className="mr-1.5">{countriesConfig[country].flag}</span>
              )}
              <select
                aria-label='Country'
                value={country}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value as CountryCode)}
                className="border-none bg-transparent text-sm outline-none cursor-pointer"
              >
                {Object.entries(countriesConfig).map(([code, { name, dial }]) => (
                  <option key={code} value={code}>
                    {visibility.hideCountryNames ? dial : `${name} (${dial})`}
                  </option>
                ))}
              </select>
              {visibility.showDialCode && (
                <span className="ml-1.5 font-semibold">
                  {countriesConfig[country].dial}
                </span>
              )}
            </div>
            <Input
              id='authx-phone'
              type={enablePhoneHint ? 'tel' : 'text'}
              name='tel'
              inputMode={enablePhoneHint ? 'tel' : undefined}
              autoComplete={enablePhoneHint ? phoneAutocomplete : undefined}
              placeholder={customLabels.placeholder}
              value={localPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalPhone(e.target.value)}
              disabled={sending}
              className={cn("flex-1", inputClassName)}
              style={finalInputStyle}
              ref={phoneInputRef}
            />
          </div>
          {enableContactPicker && contactPickerAvailable && (
            <div className="text-sm text-muted-foreground"><button type='button' className="text-primary hover:underline font-medium" onClick={handlePickContact}>Pick from contacts</button></div>
          )}
          {enablePhoneHint && (
            <div className="text-sm text-muted-foreground" aria-live="polite">Tap the field to select your phone number.</div>
          )}
          <Button
            type='button'
            onClick={handleSend}
            disabled={!valid || sending}
            className={cn("w-full", buttonClassName)}
            style={finalButtonStyle}
          >
            {customLabels.sendCode}
          </Button>
          {!!error && <div className={cn("authx-error", "p-2 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-xl")}>{error}</div>}
          {!!status && <div className={cn("authx-status", "p-2 text-sm bg-primary/10 text-primary border border-primary/20 rounded-xl")}>{status}</div>}
          </CardContent>
        </Card>
      )}

      {step === 'otp' && (
        <Card className={cn("bg-white dark:bg-slate-900", cardClassName)} style={finalCardStyle}>
          <CardContent className="space-y-4 pt-6">
          {visibility.showLabels && (
            <Label className={cn("text-sm font-semibold", labelClassName)} style={labelStyle}>
              {customLabels.enterCode}
            </Label>
          )}
          <div className="flex justify-between gap-2">
            {otp.map((d, i) => (
              <Input
                key={i}
                id={`authx-otp-${i}`}
                type='text'
                name='otp'
                inputMode='numeric'
                autoComplete='one-time-code'
                pattern='[0-9]*'
                maxLength={i === 0 ? 6 : 1}
                value={d}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onOtpChange(i, e.target.value)}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => onOtpPaste(i, e)}
                className="w-12 h-14 text-center text-xl"
                style={finalOtpInputStyle}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          {enableWebOtp && (
            <div className="authx-helper" aria-live="polite">Your code may be auto-detected for security; you might not see it in your messages.</div>
          )}
          <div className="authx-helper">
            Didn’t get it? <button type='button' className='authx-link' onClick={handleSend} disabled={sending}>Resend code</button>
          </div>
          <Button
            type='button'
            onClick={handleVerify}
            disabled={sending || otpValue.length !== 6}
            variant="success"
            className={cn("w-full", buttonClassName)}
            style={finalButtonStyle}
          >
            {customLabels.verify}
          </Button>
          {!!error && <div className={cn("authx-error", "p-3 bg-red-50 text-red-900 border border-red-200 rounded-xl text-sm")}>{error}</div>}
          {!!status && <div className={cn("authx-status", "p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-sm")}>{status}</div>}
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <Card className={cn("bg-white dark:bg-slate-900", cardClassName)} style={finalCardStyle}>
          <CardContent className="pt-6">
            <div className="text-center text-green-600 dark:text-green-400 font-semibold">
              Phone verified successfully.
            </div>
          </CardContent>
        </Card>
      )}
      {/* Keep reCAPTCHA container mounted across steps to avoid null refs inside recaptcha script */}
      <div id='authx-recaptcha' ref={recaptchaContainerRef} />
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
