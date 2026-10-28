import { describe, expect, it } from 'vitest'

import { getOrderListItemAccountDisplays } from '@/components/account/account-order-list-display'
import { getOrderPlacedStatusDisplay } from '@/components/checkout/completion/order-placed-status-display'
import { loadMessages } from '@/lib/i18n/messages'
import type { MessageDictionary, MessageKey } from '@/lib/i18n/messages'
import { getCommerceStatusLabels } from './commerce-status-labels'
import { formatStatusLabel } from './status-label'

function translator(messages: MessageDictionary) {
  return (key: MessageKey) => {
    let value: unknown = messages
    for (const segment of key.split('.')) {
      if (!value || typeof value !== 'object' || !(segment in value)) return key
      value = (value as Record<string, unknown>)[segment]
    }
    return typeof value === 'string' ? value : key
  }
}

describe('commerce status labels', () => {
  it.each(['en', 'de', 'es', 'fr', 'ja'])(
    'provides every current order status in %s',
    async (locale) => {
      const labels = getCommerceStatusLabels(
        translator(await loadMessages(locale)),
      )
      for (const status of [
        'unfulfilled',
        'fulfilled',
        'delivered',
        'partial',
        'backorder',
        'canceled',
      ]) {
        expect(labels.fulfillment[status]).toBeTruthy()
        expect(labels.fulfillment[status]).not.toContain('commerceStatus.')
      }
      for (const status of [
        'none',
        'authorized',
        'partially_paid',
        'paid',
        'partially_refunded',
        'refunded',
        'overcharged',
        'voided',
      ]) {
        expect(labels.payment[status]).toBeTruthy()
        expect(labels.payment[status]).not.toContain('commerceStatus.')
      }
      expect(labels.fulfillment.shipped).toBe(labels.fulfillment.fulfilled)
      expect(labels.fulfillment.ready).toBe(labels.fulfillment.unfulfilled)
      expect(labels.payment.credit_owed).toBe(labels.payment.overcharged)
      expect(labels.payment.void).toBe(labels.payment.voided)
    },
  )

  it('localizes account order status independently of date formatting', async () => {
    const statusLabels = getCommerceStatusLabels(
      translator(await loadMessages('ja')),
    )
    const [display] = getOrderListItemAccountDisplays({
      labels: {
        fulfillmentUnavailable: 'Unavailable',
        paymentUnavailable: 'Unavailable',
        statusLabels,
      },
      locale: 'ja',
      orders: [
        {
          completedAt: '2026-10-01T12:00:00Z',
          displayTotal: null,
          fulfillmentStatus: 'delivered',
          id: 'or_localized',
          number: 'R123456',
          paymentStatus: 'partially_refunded',
          totalQuantity: 1,
        },
      ],
    })
    expect(display.fulfillmentStatus).toBe('配達済み')
    expect(display.paymentStatus).toBe('一部返金済み')
  })

  it('localizes confirmation order and child fulfillment and payment states', async () => {
    const statusLabels = getCommerceStatusLabels(
      translator(await loadMessages('de')),
    )
    const display = getOrderPlacedStatusDisplay({
      fulfillmentStatus: 'delivered',
      fulfillments: [
        {
          displayCost: null,
          fulfilledAt: null,
          id: 'ful_localized',
          itemQuantity: 1,
          methodName: null,
          number: null,
          status: 'fulfilled',
          tracking: null,
          trackingUrl: null,
        },
      ],
      labels: {
        paymentMethodUnavailable: 'Unavailable',
        shippingMethodUnavailable: 'Unavailable',
        statusFallback: '—',
        statusLabels,
      },
      paymentStatus: 'partially_refunded',
      payments: [
        {
          displayAmount: null,
          id: 'py_localized',
          methodName: null,
          number: null,
          responseCode: null,
          sourceLabel: null,
          status: 'completed',
        },
      ],
    })
    expect(display.fulfillmentStatus).toBe('Zugestellt')
    expect(display.fulfillments[0].status).toBe('Erfüllt')
    expect(display.paymentStatus).toBe('Teilweise erstattet')
    expect(display.payments[0].status).toBe('Abgeschlossen')
  })

  it('falls back to readable words without exposing translation keys', () => {
    const labels = getCommerceStatusLabels((key) => key)
    expect(formatStatusLabel('partially_paid', '—', labels.payment)).toBe(
      'Partially Paid',
    )
    expect(formatStatusLabel('awaiting_review', '—', labels.payment)).toBe(
      'Awaiting Review',
    )
    expect(formatStatusLabel('constructor', '—', labels.payment)).toBe(
      'Constructor',
    )
    expect(formatStatusLabel(null, '—', labels.payment)).toBe('—')
  })
})
