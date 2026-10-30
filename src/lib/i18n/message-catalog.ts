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
const messageLoaders = {
  de: () => import('./messages/de.json'),
  en: async () => ({ default: enMessages }),
  es: () => import('./messages/es.json'),
  fr: () => import('./messages/fr.json'),
  ja: () => import('./messages/ja.json'),
  'zh-cn': () => import('./messages/zh-CN.json'),
} satisfies Record<string, () => Promise<{ default: MessageDictionary }>>

export type SupportedLocale = keyof typeof messageLoaders

export const fallbackMessages = enMessages
const knownMessageDictionaries = new WeakSet<object>([fallbackMessages])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function matchesDictionaryShape(value: unknown, shape: unknown): boolean {
  if (typeof shape === 'string') {
    return typeof value === 'string'
  }

  if (!isRecord(value) || !isRecord(shape)) {
    return false
  }

  return Object.entries(shape).every(
    ([key, expected]) =>
      Object.hasOwn(value, key) && matchesDictionaryShape(value[key], expected),
  )
}

export function isMessageDictionary(
  value: unknown,
): value is MessageDictionary {
  if (!isRecord(value)) {
    return false
  }

  if (knownMessageDictionaries.has(value)) {
    return true
  }

  const matchesShape = matchesDictionaryShape(value, fallbackMessages)

  if (matchesShape) {
    knownMessageDictionaries.add(value)
  }

  return matchesShape
}

function readMessage(
  messages: MessageDictionary,
  key: MessageKey,
): string | null {
  let value: unknown = messages

  for (const segment of key.split('.')) {
    if (!isRecord(value) || !Object.hasOwn(value, segment)) {
      return null
    }

    value = value[segment]
  }

  return typeof value === 'string' ? value : null
}

export function getMessage(messages: MessageDictionary, key: MessageKey) {
  return readMessage(messages, key) ?? readMessage(fallbackMessages, key) ?? key
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return Object.hasOwn(messageLoaders, value)
}

export function resolveMessageLocale(locale: string): SupportedLocale {
  const normalizedLocale = locale.trim().replaceAll('_', '-').toLowerCase()

  if (isSupportedLocale(normalizedLocale)) {
    return normalizedLocale
  }

  const language = normalizedLocale.split('-')[0]
  if (language && isSupportedLocale(language)) {
    return language
  }

  return 'en'
}

export async function loadMessages(locale: string) {
  const dictionary = await messageLoaders[resolveMessageLocale(locale)]()

  return dictionary.default
}
