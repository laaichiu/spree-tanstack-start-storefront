import { useElements } from '@stripe/react-stripe-js'
import { useCallback, useEffect, useMemo } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import {
  buildExpressCheckoutLineItems,
  getExpressCheckoutAmount,
  getExpressCheckoutSelectedShippingAmount,
} from '@/lib/checkout/utils/express/express-checkout'
import type { ExpressCheckoutLineItem } from '@/lib/checkout/utils/express/express-checkout'

export type ExpressCheckoutLineItemsBuilder = (
  order: CheckoutOrder,
  options?: {
    amountDueShippingAmount?: number
    shippingAmount?: number
  },
) => ExpressCheckoutLineItem[]

export function useExpressCheckoutLineItems({ cart }: { cart: CheckoutOrder }) {
  const elements = useElements()
  const { t } = useMarket()
  const lineItemLabels = useMemo(
    () => ({
      discountLabel: t('cart.discount'),
      checkoutCreditLabel: t('checkout.giftCardOrStoreCredit'),
      shippingLabel: t('cart.shipping'),
      subtotalLabel: t('cart.subtotal'),
      taxLabel: t('cart.tax'),
    }),
    [t],
  )

  const buildLineItems = useCallback<ExpressCheckoutLineItemsBuilder>(
    (order, { amountDueShippingAmount, shippingAmount } = {}) =>
      buildExpressCheckoutLineItems({
        amountDueShippingAmount,
        checkoutCreditLabel: lineItemLabels.checkoutCreditLabel,
        discountLabel: lineItemLabels.discountLabel,
        order,
        shippingAmount,
        shippingLabel: lineItemLabels.shippingLabel,
        subtotalLabel: lineItemLabels.subtotalLabel,
        taxLabel: lineItemLabels.taxLabel,
      }),
    [lineItemLabels],
  )

  const buildCurrentLineItems = useCallback(
    (order: CheckoutOrder) => {
      const shippingAmount = getExpressCheckoutSelectedShippingAmount(order)

      return buildLineItems(order, {
        amountDueShippingAmount: shippingAmount ?? undefined,
        shippingAmount: shippingAmount ?? undefined,
      })
    },
    [buildLineItems],
  )

  const updateElementsAmount = useCallback(
    (amount: number) => {
      if (!elements) {
        return
      }

      void elements.update({ amount }).catch(() => undefined)
    },
    [elements],
  )

  useEffect(() => {
    updateElementsAmount(getExpressCheckoutAmount(cart))
  }, [cart, updateElementsAmount])

  return {
    buildCurrentLineItems,
    buildLineItems,
    updateElementsAmount,
  }
}
