import { describe, expect, it, vi } from 'vitest'

import {
  isNewsletterPopupDismissed,
  markNewsletterPopupDismissed,
  NEWSLETTER_POPUP_DISMISSED_KEY,
} from './newsletter-popup-dismissal'

describe('newsletter popup dismissal storage', () => {
  it('uses a versioned key and stores a timestamp', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    }

    markNewsletterPopupDismissed(storage)

    expect(NEWSLETTER_POPUP_DISMISSED_KEY).toBe(
      'spree_newsletter_popup_dismissed_at_v1',
    )
    expect(storage.setItem).toHaveBeenCalledWith(
      NEWSLETTER_POPUP_DISMISSED_KEY,
      expect.any(String),
    )
  })

  it('treats a stored value as dismissed', () => {
    const storage = {
      getItem: vi.fn(() => '2026-07-27T00:00:00.000Z'),
      setItem: vi.fn(),
    }

    expect(isNewsletterPopupDismissed(storage)).toBe(true)
    expect(storage.getItem).toHaveBeenCalledWith(NEWSLETTER_POPUP_DISMISSED_KEY)
  })

  it('keeps the popup usable when storage throws', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage blocked')
      }),
      setItem: vi.fn(() => {
        throw new Error('storage blocked')
      }),
    }

    expect(isNewsletterPopupDismissed(storage)).toBe(false)
    expect(() => markNewsletterPopupDismissed(storage)).not.toThrow()
  })
})
