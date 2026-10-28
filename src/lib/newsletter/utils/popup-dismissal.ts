export const NEWSLETTER_POPUP_DISMISSED_KEY =
  'spree_newsletter_popup_dismissed_at_v1'

type NewsletterPopupStorage = Pick<Storage, 'getItem' | 'setItem'>

function getBrowserStorage(): NewsletterPopupStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isNewsletterPopupDismissed(
  storage: NewsletterPopupStorage | null = getBrowserStorage(),
) {
  try {
    return Boolean(storage?.getItem(NEWSLETTER_POPUP_DISMISSED_KEY))
  } catch {
    return false
  }
}

export function markNewsletterPopupDismissed(
  storage: NewsletterPopupStorage | null = getBrowserStorage(),
) {
  try {
    storage?.setItem(NEWSLETTER_POPUP_DISMISSED_KEY, new Date().toISOString())
  } catch {
    // If storage is unavailable, closing the in-memory dialog is enough.
  }
}
