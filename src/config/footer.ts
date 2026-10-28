import type { MessageKey } from '@/lib/i18n/messages'

type FooterTranslationKey = Extract<MessageKey, `footer.${string}`>

type FooterInternalTarget = 'account' | 'giftCards' | 'register'

type FooterColumnPolicyLink =
  | {
      kind: 'policy'
      labelKey: 'footer.returnPolicy'
      policySlug: 'returns-policy'
    }
  | {
      kind: 'policy'
      labelKey: 'footer.shippingInfo'
      policySlug: 'shipping-policy'
    }

export type FooterConfigLink =
  | {
      kind: 'internal'
      labelKey: FooterTranslationKey
      preload?: false
      target: FooterInternalTarget
    }
  | FooterColumnPolicyLink
  | {
      href: string
      kind: 'external'
      labelKey: FooterTranslationKey
    }
  | { kind: 'text'; labelKey: FooterTranslationKey }

type FooterConfigColumn = {
  links: readonly FooterConfigLink[]
  titleKey: FooterTranslationKey
}

export const footerColumns = [
  {
    titleKey: 'footer.account',
    links: [
      {
        kind: 'internal',
        labelKey: 'footer.manageAccount',
        preload: false,
        target: 'account',
      },
      {
        kind: 'internal',
        labelKey: 'footer.signUp',
        target: 'register',
      },
      {
        kind: 'internal',
        labelKey: 'footer.redeemGiftCard',
        preload: false,
        target: 'giftCards',
      },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { kind: 'text', labelKey: 'footer.about' },
      { kind: 'text', labelKey: 'footer.environmentalInitiatives' },
      { kind: 'text', labelKey: 'footer.dei' },
      { kind: 'text', labelKey: 'footer.careers' },
      { kind: 'text', labelKey: 'footer.accessibility' },
    ],
  },
  {
    titleKey: 'footer.getHelp',
    links: [
      { kind: 'text', labelKey: 'footer.helpCenter' },
      { kind: 'text', labelKey: 'footer.liveChat' },
      {
        kind: 'policy',
        labelKey: 'footer.returnPolicy',
        policySlug: 'returns-policy',
      },
      {
        kind: 'policy',
        labelKey: 'footer.shippingInfo',
        policySlug: 'shipping-policy',
      },
      { kind: 'text', labelKey: 'footer.bulkOrders' },
    ],
  },
  {
    titleKey: 'footer.connect',
    links: [
      {
        href: 'https://www.instagram.com/',
        kind: 'external',
        labelKey: 'footer.instagram',
      },
      {
        href: 'https://www.tiktok.com/',
        kind: 'external',
        labelKey: 'footer.tiktok',
      },
      {
        href: 'https://www.youtube.com/',
        kind: 'external',
        labelKey: 'footer.youtube',
      },
      {
        href: 'https://www.pinterest.com/',
        kind: 'external',
        labelKey: 'footer.pinterest',
      },
      { kind: 'text', labelKey: 'footer.affiliates' },
      { kind: 'text', labelKey: 'footer.ourStores' },
    ],
  },
] as const satisfies readonly FooterConfigColumn[]

export type FooterLegalLink =
  | { labelKey: 'footer.privacyPolicy'; policySlug: 'privacy-policy' }
  | { labelKey: 'footer.returnPolicy'; policySlug: 'returns-policy' }
  | { labelKey: 'footer.shippingPolicy'; policySlug: 'shipping-policy' }
  | { labelKey: 'footer.termsOfService'; policySlug: 'terms-of-service' }

export const legalLinks = [
  { labelKey: 'footer.shippingPolicy', policySlug: 'shipping-policy' },
  { labelKey: 'footer.privacyPolicy', policySlug: 'privacy-policy' },
  { labelKey: 'footer.returnPolicy', policySlug: 'returns-policy' },
  { labelKey: 'footer.termsOfService', policySlug: 'terms-of-service' },
] as const satisfies readonly FooterLegalLink[]
