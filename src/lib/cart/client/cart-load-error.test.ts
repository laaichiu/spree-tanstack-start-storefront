import { describe, expect, it } from 'vitest'

import { hasCartLoadError } from './cart-load-error'

describe('hasCartLoadError', () => {
  it('keeps an initial server load error visible until the first fetch settles', () => {
    expect(
      hasCartLoadError({
        error: null,
        initialCartLoadError: 'Cart could not be loaded.',
        isFetched: false,
      }),
    ).toBe(true)
  })

  it('clears the initial error after a successful client fetch', () => {
    expect(
      hasCartLoadError({
        error: null,
        initialCartLoadError: 'Cart could not be loaded.',
        isFetched: true,
      }),
    ).toBe(false)
  })

  it('keeps runtime query errors visible regardless of fetch state', () => {
    expect(
      hasCartLoadError({
        error: new Error('network failure'),
        initialCartLoadError: null,
        isFetched: true,
      }),
    ).toBe(true)
  })
})
