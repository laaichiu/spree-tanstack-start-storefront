import '@tanstack/react-start/server-only'

import { isOrderGroup } from '@spree/sdk'
import type {
  Client,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
} from '@spree/sdk'

import { getCheckoutCartRequestOptions } from '@/lib/checkout/api/checkout-session.server'
import { getCompletedOrderLookupRequestOptions } from '@/lib/checkout/utils/completion/completed-order-access'
import {
  assertCheckoutOrderResourceMatchesRequestedId,
  isCheckoutOrderResourceIdentityMismatchError,
} from '@/lib/checkout/utils/order-resource-identity'
import { readSpreeErrorStatus } from '@/lib/spree/errors'

type CheckoutOrdersClient = {
  orders: Pick<Client['orders'], 'get'>
}

async function tryLookupCheckoutOrder({
  cartId,
  client,
  requestOptions,
}: {
  cartId: string
  client: CheckoutOrdersClient
  requestOptions: Parameters<CheckoutOrdersClient['orders']['get']>[2]
}) {
  try {
    const response = await client.orders.get(cartId, undefined, requestOptions)

    assertCheckoutOrderResourceMatchesRequestedId(response, cartId)

    return { ok: true as const, response }
  } catch (error) {
    if (isCheckoutOrderResourceIdentityMismatchError(error)) {
      throw error
    }

    return { ok: false as const }
  }
}

async function lookupCompletedOrderWithAccessToken({
  cartId,
  client,
  completedOrderToken,
}: {
  cartId: string
  client: CheckoutOrdersClient
  completedOrderToken: string
}) {
  const result = await tryLookupCheckoutOrder({
    cartId,
    client,
    requestOptions: getCompletedOrderLookupRequestOptions(completedOrderToken),
  })

  return result.ok ? result.response : null
}

export async function lookupCheckoutOrderWithCartCredentials({
  cartId,
  cartToken,
  completedOrderToken,
  client,
}: {
  cartId: string
  cartToken?: string
  completedOrderToken?: string
  client: CheckoutOrdersClient
}): Promise<SpreeOrder | SpreeOrderGroup | null> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  const initialLookup = await tryLookupCheckoutOrder({
    cartId,
    client,
    requestOptions,
  })

  if (initialLookup.ok) {
    return initialLookup.response
  }

  if (!requestOptions.token || !requestOptions.spreeToken) {
    return completedOrderToken
      ? lookupCompletedOrderWithAccessToken({
          cartId,
          client,
          completedOrderToken,
        })
      : null
  }

  const guestLookup = await tryLookupCheckoutOrder({
    cartId,
    client,
    requestOptions: getCheckoutCartRequestOptions(cartToken, ''),
  })

  if (guestLookup.ok) {
    return guestLookup.response
  }

  return completedOrderToken
    ? lookupCompletedOrderWithAccessToken({
        cartId,
        client,
        completedOrderToken,
      })
    : null
}

export async function replayCompletedCheckoutGroupWithCartCredentials({
  cartId,
  cartToken,
  client,
}: {
  cartId: string
  cartToken?: string
  client: { carts: Pick<Client['carts'], 'get' | 'complete'> }
}): Promise<SpreeOrderGroup | null> {
  if (!cartToken || !cartId.startsWith('cart_')) {
    return null
  }

  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  try {
    await client.carts.get(cartId, requestOptions)
    return null
  } catch (error) {
    // A live cart is not a replay candidate. Only Spree's completed-cart 404
    // permits an idempotent complete call to recover its OrderGroup.
    if (readSpreeErrorStatus(error) !== 404) {
      return null
    }
  }

  try {
    const result = await client.carts.complete(cartId, requestOptions)
    return isOrderGroup(result) ? result : null
  } catch {
    return null
  }
}
