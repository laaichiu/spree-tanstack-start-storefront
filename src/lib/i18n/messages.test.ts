import { describe, expect, it } from 'vitest'

import deMessages from './messages/de.json'
import enMessages from './messages/en.json'
import esMessages from './messages/es.json'
import frMessages from './messages/fr.json'
import jaMessages from './messages/ja.json'
import {
  formatDate,
  formatDateTime,
  formatNumber,
  loadMessages,
  translateMessage,
} from './messages'

function collectMessageKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key

    if (typeof child === 'string') {
      return [path]
    }

    return collectMessageKeys(child, path)
  })
}

describe('message dictionaries', () => {
  it('keeps locale JSON files aligned with the English keys', () => {
    const expectedKeys = collectMessageKeys(enMessages).sort()

    for (const [locale, messages] of Object.entries({
      de: deMessages,
      es: esMessages,
      fr: frMessages,
      ja: jaMessages,
    })) {
      expect(collectMessageKeys(messages).sort(), locale).toEqual(expectedKeys)
    }
  })

  it('loads the active locale without changing route-message fallbacks', async () => {
    const frenchMessages = await loadMessages('fr-FR')
    const germanMessages = await loadMessages('de-DE')
    const normalizedSpanishMessages = await loadMessages('  ES_mx  ')
    const fallbackMessages = await loadMessages('pt-BR')

    expect(frenchMessages.home.heroTitle).toBe('Faconne par la lumiere')
    expect(normalizedSpanishMessages.home.heroTitle).toBe('Moldeado por la luz')
    expect(germanMessages.header.popularSearches).toBe('Beliebte Suchanfragen')
    expect(germanMessages.header.suggestedProducts).toBe(
      'Vorgeschlagene Artikel',
    )
    expect(germanMessages.header.searchPlaceholder).toBe('Produkte suchen')
    expect(fallbackMessages.home.heroTitle).toBe(enMessages.home.heroTitle)
    expect(translateMessage('fr-FR', 'checkout.checkout')).toBe('Paiement')
    expect(translateMessage('de-DE', 'checkout.checkout')).toBe('Kasse')
    expect(translateMessage(' JA_jp ', 'checkout.checkout')).toBe(
      'チェックアウト',
    )
  })

  it('keeps cart trust messages localized in every supported language', () => {
    expect(enMessages.cart.freeShippingSpendMore).toBe(
      'Spend {amount} more to get free standard shipping',
    )
    expect(esMessages.cart.freeShippingSpendMore).toBe(
      'Gasta {amount} mas para obtener envio estandar gratis',
    )
    expect(frMessages.cart.freeShippingSpendMore).toBe(
      'Depensez encore {amount} pour obtenir la livraison standard gratuite',
    )
    expect(jaMessages.cart.freeShippingSpendMore).toBe(
      'あと {amount} で通常配送が無料になります',
    )
    expect(
      [enMessages, esMessages, frMessages, jaMessages].map(
        (messages) => messages.cart.freeShippingReceived,
      ),
    ).toEqual([
      "You've received free shipping!",
      'Has recibido envio gratis!',
      'Vous beneficiez de la livraison gratuite !',
      '送料無料が適用されました！',
    ])

    expect(
      [enMessages, esMessages, frMessages, jaMessages].map(
        (messages) => messages.checkout.secureCheckout,
      ),
    ).toEqual([
      'Secure checkout',
      'Checkout seguro',
      'Paiement securise',
      '安全なチェックアウト',
    ])
  })

  it('formats numbers and dates while preserving invalid date values', () => {
    expect(formatNumber(1234, 'en-US')).toBe('1,234')
    expect(formatDate('2026-01-02T12:00:00.000Z', 'en-US')).toContain(
      'Jan 2, 2026',
    )
    expect(formatDateTime('2026-01-02T12:00:00.000Z', 'en-US')).toContain(
      'Jan 2, 2026',
    )
    expect(formatDate('not-a-date', 'en-US')).toBe('not-a-date')
  })
})
