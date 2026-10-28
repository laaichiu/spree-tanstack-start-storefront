import type { ReactNode } from 'react'

import { createCheckoutReadyStateSlots } from '@/components/checkout/checkout-ready-state-slots'
import type { CheckoutReadyStateControllerValue } from '@/components/checkout/checkout-ready-state-slots'
import { useCheckoutReadyStateRuntime } from '@/components/checkout/use-checkout-ready-state'
import type { CheckoutReadyStateOptions } from '@/components/checkout/use-checkout-ready-state'

export type { CheckoutReadyStateControllerValue } from '@/components/checkout/checkout-ready-state-slots'

type CheckoutReadyStateControllerProps = CheckoutReadyStateOptions & {
  children: (controller: CheckoutReadyStateControllerValue) => ReactNode
}

export function CheckoutReadyStateController({
  children,
  ...options
}: CheckoutReadyStateControllerProps) {
  const runtime = useCheckoutReadyStateRuntime(options)

  return children(createCheckoutReadyStateSlots(runtime))
}
