import { createServerFn } from '@tanstack/react-start'

import { clearCartCookies } from '@/lib/cookies/cart-cookie.server'

export const resetCartSession = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: true }> => {
    clearCartCookies()

    return {
      success: true,
    }
  },
)
