// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCustomerGiftCardMatchesMarket,
  CustomerGiftCardCurrencyMismatchError,
} from './gift-card-market'

const market = { currencyCode: 'USD' }

describe('customer gift-card market ownership', () => {
  it('accepts a matching currency case-insensitively', () => {
    expect(() =>
      assertCustomerGiftCardMatchesMarket({ currency: ' usd ' }, market),
    ).not.toThrow()
  })

  it.each([{ currency: 'EUR' }, { currency: ' ' }, { currency: undefined }])(
    'rejects an incompatible or incomplete currency: %o',
    (giftCard) => {
      expect(() =>
        assertCustomerGiftCardMatchesMarket(giftCard, market),
      ).toThrow(CustomerGiftCardCurrencyMismatchError)
    },
  )
})
