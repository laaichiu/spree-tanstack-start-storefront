import { useEffect, useState } from 'react'

import { resolveStripePaymentElementAppearance } from './stripe-payment-element-appearance'

export function useStripePaymentElementAppearance() {
  const [appearance, setAppearance] = useState<ReturnType<
    typeof resolveStripePaymentElementAppearance
  > | null>(null)

  useEffect(() => {
    function updateAppearance() {
      setAppearance(resolveStripePaymentElementAppearance())
    }

    updateAppearance()

    const observer = new MutationObserver(updateAppearance)
    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return appearance
}
