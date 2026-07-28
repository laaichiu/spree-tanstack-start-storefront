export const CHECKOUT_BROWSER_AUTOFILL_SYNC_DELAYS = [0, 250, 750] as const

export function isCheckoutSavedAddressEvent(event: {
  target: EventTarget | null
}) {
  return (
    event.target instanceof Element &&
    Boolean(event.target.closest('[data-checkout-saved-addresses]'))
  )
}

export function scheduleCheckoutBrowserAutofillSync(
  syncFields: () => void,
  schedule: (
    callback: () => void,
    delay: number,
  ) => unknown = window.setTimeout,
) {
  syncFields()

  for (const delay of CHECKOUT_BROWSER_AUTOFILL_SYNC_DELAYS) {
    schedule(syncFields, delay)
  }
}
