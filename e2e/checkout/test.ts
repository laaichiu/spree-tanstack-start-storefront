import { expect, test as base } from '@playwright/test'

import { attachStripeDiagnostics } from './stripe-payment'

const NEWSLETTER_POPUP_DISMISSED_KEY = 'spree_newsletter_popup_dismissed_at'

export const test = base.extend<{ checkoutPageSetup: void }>({
  checkoutPageSetup: [
    async ({ page }, use) => {
      await page.addInitScript((key) => {
        window.localStorage.setItem(key, new Date().toISOString())
      }, NEWSLETTER_POPUP_DISMISSED_KEY)

      attachStripeDiagnostics(page)
      await use()
    },
    { auto: true },
  ],
})

export { expect }
