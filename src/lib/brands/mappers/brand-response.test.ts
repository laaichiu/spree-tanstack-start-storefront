import { describe, expect, it } from 'vitest'
import type { Seller as SpreeSeller } from '@spree/sdk'

import {
  assertSpreeSellerResource,
  assertSpreeSellerSlugMatchesRequestedSlug,
  BrandResourceTypeMismatchError,
} from './brand-response'

const seller = {
  about: 'A public brand profile.',
  about_html: '<p>A public brand profile.</p>',
  cover_photo_url: null,
  id: 'sel_apple',
  logo_url: 'https://cdn.example.test/apple.svg',
  name: 'Apple',
  policies: null,
  slug: 'apple',
  square_logo_url: null,
}

describe('public Seller response boundary', () => {
  it('accepts the beta2 public Seller shape', () => {
    expect(() => assertSpreeSellerResource(seller)).not.toThrow()
  })

  it('rejects a non-Seller resource', () => {
    expect(() =>
      assertSpreeSellerResource({ ...seller, id: 'prd_wrong' }),
    ).toThrow(BrandResourceTypeMismatchError)
  })

  it('rejects a response whose slug is not the requested identity', () => {
    expect(() =>
      assertSpreeSellerSlugMatchesRequestedSlug(
        seller as unknown as SpreeSeller,
        'other',
      ),
    ).toThrow(BrandResourceTypeMismatchError)
  })
})
