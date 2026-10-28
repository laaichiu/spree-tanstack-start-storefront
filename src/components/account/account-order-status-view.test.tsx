import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { AccountOrderStatusView } from './account-order-status-view'

afterEach(cleanup)

describe('AccountOrderStatusView', () => {
  it('passes tracking links to the direct renderer', () => {
    const renderTrackingLink = vi.fn(
      (url: string, props: { children: ReactNode; className: string }) => (
        <a className={props.className} href={url}>
          {props.children}
        </a>
      ),
    )

    render(
      <AccountOrderStatusView
        model={{
          fulfillments: [
            {
              id: 'fulfillment_123',
              itemQuantity: '1',
              methodName: 'Standard shipping',
              shipmentLabel: 'Shipment 1',
              shippingCost: '$5.00',
              statusLabel: 'Shipped',
              tracking: 'TRACK123',
              trackingUrl: 'https://carrier.example/track/TRACK123',
            },
          ],
          labels: {
            authorizationCode: 'Authorization code',
            fulfilledAt: 'Fulfilled at',
            fulfillmentDescription: 'Track your shipment.',
            itemsInShipment: 'Items',
            noFulfillments: 'No shipments',
            noPayments: 'No payments',
            noTrackingInfo: 'No tracking information',
            paymentAmount: 'Amount',
            paymentDescription: 'Payment details.',
            paymentInformation: 'Payment information',
            paymentReference: 'Reference',
            shipment: 'Shipment',
            shippingCost: 'Shipping cost',
            shippingOrigin: 'Shipping origin',
            trackingNumber: 'Tracking number',
            trackShipment: 'Track shipment',
          },
          payments: [],
        }}
        renderTrackingLink={renderTrackingLink}
      />,
    )

    expect(renderTrackingLink).toHaveBeenCalledWith(
      'https://carrier.example/track/TRACK123',
      expect.objectContaining({ className: expect.any(String) }),
    )
    expect(
      screen.getByRole('link', { name: 'Track shipment' }).getAttribute('href'),
    ).toBe('https://carrier.example/track/TRACK123')
  })
})
