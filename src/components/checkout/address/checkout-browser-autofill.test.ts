import { describe, expect, it, vi } from 'vitest'

import {
  CHECKOUT_BROWSER_AUTOFILL_SYNC_DELAYS,
  isCheckoutSavedAddressEvent,
  scheduleCheckoutBrowserAutofillSync,
} from './checkout-browser-autofill'

describe('checkout browser autofill helpers', () => {
  it('recognizes saved address events', () => {
    const container = document.createElement('div')
    container.dataset.checkoutSavedAddresses = ''
    const button = document.createElement('button')

    container.append(button)

    expect(isCheckoutSavedAddressEvent({ target: button })).toBe(true)
    expect(
      isCheckoutSavedAddressEvent({
        target: document.createElement('input'),
      }),
    ).toBe(false)
    expect(isCheckoutSavedAddressEvent({ target: null })).toBe(false)
  })

  it('runs browser autofill sync immediately and at stable delays', () => {
    const syncFields = vi.fn()
    const schedule = vi.fn()

    scheduleCheckoutBrowserAutofillSync(syncFields, schedule)

    expect(syncFields).toHaveBeenCalledTimes(1)
    expect(schedule).toHaveBeenCalledTimes(
      CHECKOUT_BROWSER_AUTOFILL_SYNC_DELAYS.length,
    )
    expect(schedule.mock.calls.map(([, delay]) => delay)).toEqual([
      ...CHECKOUT_BROWSER_AUTOFILL_SYNC_DELAYS,
    ])
  })
})
