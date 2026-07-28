import { SpreeError } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import {
  isRecoverableCartCookieError,
  isRecoverableCartResponseError,
} from './cart-errors'

function makeSpreeError(status: number) {
  return new SpreeError(
    {
      error: {
        code: 'cart_unavailable',
        message: 'Cart is unavailable',
      },
    },
    status,
  )
}

describe('isRecoverableCartCookieError', () => {
  it.each([401, 403, 404])(
    'treats Spree status %s as a recoverable stale cart cookie',
    (status) => {
      expect(isRecoverableCartCookieError(makeSpreeError(status))).toBe(true)
    },
  )

  it('does not recover from Spree server errors', () => {
    expect(isRecoverableCartCookieError(makeSpreeError(500))).toBe(false)
  })

  it('does not recover from ordinary runtime errors', () => {
    expect(isRecoverableCartCookieError(new Error('Network failed'))).toBe(
      false,
    )
  })

  it('treats SDK not found errors as recoverable stale cart cookies', () => {
    expect(isRecoverableCartCookieError(new Error('Not found'))).toBe(true)
  })
})

describe('isRecoverableCartResponseError', () => {
  it('recovers from stale cart cookie errors', () => {
    expect(isRecoverableCartResponseError(makeSpreeError(404))).toBe(true)
  })

  it('recovers from SDK JSON parse failures caused by HTML responses', () => {
    expect(
      isRecoverableCartResponseError(
        new SyntaxError(
          'Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON',
        ),
      ),
    ).toBe(true)
  })

  it('does not recover from unrelated runtime errors', () => {
    expect(isRecoverableCartResponseError(new Error('Network failed'))).toBe(
      false,
    )
  })
})
