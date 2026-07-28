import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { getCheckoutRouteNavigation } from '@/lib/checkout/utils/checkout-navigation'

import { useUpdateCheckoutAddress } from './use-checkout-address'
import type { CheckoutAddressUpdateInput } from './use-checkout-address'

export function useCheckoutShippingAddressSave({
  cart,
  setCheckoutError,
}: {
  cart: CheckoutOrder
  setCheckoutError: (error: string | null) => void
}) {
  const { market, t } = useMarket()
  const navigate = useNavigate()
  const { isPending: isAddressPending, mutateAsync: saveCheckoutAddressAsync } =
    useUpdateCheckoutAddress({
      cartId: cart.id,
    })

  const saveShippingAddress = useCallback(
    async (
      input: CheckoutAddressUpdateInput,
    ): Promise<CheckoutOrder | null> => {
      try {
        const updatedCart = await saveCheckoutAddressAsync(input)

        if (updatedCart.id !== cart.id) {
          await navigate(
            getCheckoutRouteNavigation({
              cartId: updatedCart.id,
              country: market.country,
              locale: market.locale,
            }),
          )
        }

        return updatedCart
      } catch (error) {
        setCheckoutError(
          error instanceof Error
            ? error.message
            : t('checkout.deliverySaveFailed'),
        )

        return null
      }
    },
    [
      cart.id,
      market.country,
      market.locale,
      navigate,
      setCheckoutError,
      t,
      saveCheckoutAddressAsync,
    ],
  )

  return {
    isAddressPending,
    saveShippingAddress,
  }
}
