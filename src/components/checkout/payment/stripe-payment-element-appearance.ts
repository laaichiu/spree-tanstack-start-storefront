import type { Appearance } from '@stripe/stripe-js'

type StripeAppearanceState = {
  appearance: Appearance
  key: string
}

const STRIPE_APPEARANCE_COLORS = {
  dark: {
    background: '#242424',
    border: 'rgba(255, 255, 255, 0.14)',
    danger: '#f87171',
    foreground: '#fafafa',
    mutedForeground: '#a3a3a3',
    ring: '#8f8f8f',
  },
  light: {
    background: '#ffffff',
    border: '#e5e5e5',
    danger: '#dc2626',
    foreground: '#111111',
    mutedForeground: '#737373',
    ring: '#a3a3a3',
  },
} as const

function readToken(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string,
) {
  return styles.getPropertyValue(name).trim() || fallback
}

export function resolveStripePaymentElementAppearance(): StripeAppearanceState {
  const styles = window.getComputedStyle(document.documentElement)
  const mode = document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light'
  const { background, border, danger, foreground, mutedForeground, ring } =
    STRIPE_APPEARANCE_COLORS[mode]
  const fontFamily = readToken(
    styles,
    '--font-sans',
    'ui-sans-serif, system-ui, sans-serif',
  )

  return {
    appearance: {
      theme: 'stripe',
      variables: {
        borderRadius: '6px',
        colorBackground: background,
        colorDanger: danger,
        colorPrimary: foreground,
        colorText: foreground,
        colorTextPlaceholder: mutedForeground,
        colorTextSecondary: mutedForeground,
        focusBoxShadow: `0 0 0 1px ${ring}`,
        fontFamily,
        fontSizeBase: '15px',
      },
      rules: {
        '.Input': {
          boxShadow: 'none',
          paddingBottom: '13px',
          paddingTop: '13px',
        },
        '.Tab': {
          border: `1px solid ${border}`,
          boxShadow: 'none',
        },
        '.Tab--selected': {
          borderColor: foreground,
        },
      },
    },
    key: [
      mode,
      background,
      foreground,
      border,
      danger,
      mutedForeground,
      ring,
      fontFamily,
    ].join(':'),
  }
}
