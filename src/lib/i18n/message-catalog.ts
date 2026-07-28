import enMessages from './messages/en.json'

export type MessageDictionary = typeof enMessages
type NestedMessageKey<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${NestedMessageKey<T[K]>}`
      : never
}[keyof T & string]

export type MessageKey = NestedMessageKey<MessageDictionary>
export type SupportedLocale = 'de' | 'en' | 'es' | 'fr' | 'ja'

const messageLoaders: Record<
  SupportedLocale,
  () => Promise<{ default: MessageDictionary }>
> = {
  de: () => import('./messages/de.json'),
  en: async () => ({ default: enMessages }),
  es: () => import('./messages/es.json'),
  fr: () => import('./messages/fr.json'),
  ja: () => import('./messages/ja.json'),
}

export const fallbackMessages = enMessages

export function resolveMessageLocale(locale: string): SupportedLocale {
  const language = locale
    .trim()
    .replaceAll('_', '-')
    .toLowerCase()
    .split('-')[0]

  return language === 'de' ||
    language === 'es' ||
    language === 'fr' ||
    language === 'ja'
    ? language
    : 'en'
}

export async function loadMessages(locale: string) {
  const dictionary = await messageLoaders[resolveMessageLocale(locale)]()

  return dictionary.default
}
