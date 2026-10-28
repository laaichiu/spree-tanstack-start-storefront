import type { Cart as SpreeCart, Order as SpreeOrder } from '@spree/sdk'

import type { CartSummary } from '@/lib/cart/contracts'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'
import {
  mapSpreeAppliedDiscount,
  mapSpreeAppliedGiftCard,
} from './cart-adjustments.mapper'
import { mapSpreeLineItemToCartLineItem } from './cart-line-item.mapper'
import {
  mapSpreeShippingDiscountTotal,
  mapSpreeShippingRates,
} from './cart-shipping.mapper'
import { assertSpreeCartProjectionResponse } from './cart-projection-response'

function hasCartCheckoutFields(
  cart: SpreeCart | SpreeOrder,
): cart is SpreeCart {
  return 'current_step' in cart && 'completed_steps' in cart
}

function readCouponCode(cart: SpreeCart | SpreeOrder) {
  const couponCode = (cart as SpreeCart & { coupon_code?: unknown }).coupon_code

  return typeof couponCode === 'string' && couponCode.trim()
    ? couponCode.trim()
    : null
}

export function mapSpreeCartToSummary(
  cart: SpreeCart | SpreeOrder,
): CartSummary {
  assertSpreeCartProjectionResponse(cart)

  const couponCode = readCouponCode(cart)

  return {
    ...(couponCode ? { couponCode } : {}),
    id: cart.id,
    itemCount: cart.total_quantity,
    currencyCode: cart.currency,
    currentStep: hasCartCheckoutFields(cart) ? cart.current_step : null,
    completedSteps: hasCartCheckoutFields(cart) ? cart.completed_steps : [],
    items: cart.items.map(mapSpreeLineItemToCartLineItem),
    shippingRates: mapSpreeShippingRates(cart),
    appliedDiscounts: cart.discounts.map((discount) =>
      mapSpreeAppliedDiscount(discount, cart.currency),
    ),
    appliedGiftCard: mapSpreeAppliedGiftCard(cart),
    itemTotal: mapSpreeAmountToMoney(cart.item_total, cart.currency),
    discountTotal: mapSpreeAmountToMoney(cart.discount_total, cart.currency),
    deliveryTotal: mapSpreeAmountToMoney(cart.delivery_total, cart.currency),
    shippingDiscountTotal: mapSpreeShippingDiscountTotal(cart),
    taxTotal: mapSpreeAmountToMoney(cart.tax_total, cart.currency),
    total: mapSpreeAmountToMoney(cart.total, cart.currency),
  }
}
