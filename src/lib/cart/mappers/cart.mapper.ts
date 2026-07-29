import type {
  Cart as SpreeCart,
  DeliveryRate as SpreeDeliveryRate,
  Fulfillment as SpreeFulfillment,
  LineItem as SpreeLineItem,
  Order as SpreeOrder,
} from '@spree/sdk'

import type {
  CartAppliedDiscount,
  CartAppliedGiftCard,
  CartLineItem,
  CartLineItemOptionValue,
  CartShippingRate,
  CartSummary,
} from '@/lib/cart/model/cart'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'
import type { Money } from '@/lib/money/money'

function mapLineItem(item: SpreeLineItem): CartLineItem {
  return {
    id: item.id,
    variantId: item.variant_id,
    productSlug: item.slug,
    name: item.name,
    optionsText: item.options_text,
    optionValues: mapLineItemOptionValues(item),
    quantity: item.quantity,
    imageUrl: item.thumbnail_url,
    unitPrice: mapSpreeAmountToMoney(item.price, item.currency),
    totalPrice: mapSpreeAmountToMoney(item.total, item.currency),
  }
}

function mapLineItemOptionValues(
  item: SpreeLineItem,
): CartLineItemOptionValue[] {
  return item.option_values.map((optionValue) => ({
    id: optionValue.id,
    label: optionValue.label,
    name: optionValue.name,
    optionTypeId: optionValue.option_type_id,
    optionTypeLabel: optionValue.option_type_label,
    optionTypeName: optionValue.option_type_name,
    position: optionValue.position,
    colorCode: optionValue.color_code,
  }))
}

function hasCartCheckoutFields(
  cart: SpreeCart | SpreeOrder,
): cart is SpreeCart {
  return 'current_step' in cart && 'completed_steps' in cart
}

function readFulfillments(cart: SpreeCart | SpreeOrder): SpreeFulfillment[] {
  return 'fulfillments' in cart && Array.isArray(cart.fulfillments)
    ? cart.fulfillments
    : []
}

function mapShippingRate({
  currencyCode,
  fulfillment,
  rate,
}: {
  currencyCode: string
  fulfillment: SpreeFulfillment
  rate: SpreeDeliveryRate
}): CartShippingRate {
  return {
    deliveryMethodId: rate.delivery_method_id,
    id: rate.id,
    fulfillmentId: fulfillment.id,
    name: rate.name,
    selected: rate.selected,
    displayPrice: mapSpreeAmountToMoney(rate.cost, currencyCode),
    price: mapSpreeAmountToMoney(rate.total, currencyCode),
  }
}

function mapShippingRates(cart: SpreeCart | SpreeOrder): CartShippingRate[] {
  return readFulfillments(cart).flatMap((fulfillment) =>
    fulfillment.delivery_rates.map((rate) =>
      mapShippingRate({
        currencyCode: cart.currency,
        fulfillment,
        rate,
      }),
    ),
  )
}

function mapAppliedDiscount(
  discount: SpreeCart['discounts'][number],
  currencyCode: string,
): CartAppliedDiscount {
  return {
    id: discount.id,
    promotionId: discount.promotion_id,
    name: discount.name,
    description: discount.description,
    code: discount.code,
    amount: mapSpreeAmountToMoney(discount.amount, currencyCode),
  }
}

function mapAppliedGiftCard(
  cart: SpreeCart | SpreeOrder,
): CartAppliedGiftCard | null {
  const giftCard = cart.gift_card

  if (!giftCard) {
    return null
  }

  const appliedAmount = mapSpreeAmountToMoney(
    cart.gift_card_total,
    cart.currency,
  )

  return {
    id: giftCard.id,
    code: giftCard.code,
    status: giftCard.status,
    appliedAmount: appliedAmount
      ? {
          amount: -Math.abs(appliedAmount.amount),
          currencyCode: appliedAmount.currencyCode,
        }
      : null,
    amountRemaining: mapSpreeAmountToMoney(
      giftCard.amount_remaining,
      giftCard.currency,
    ),
    expiresAt: giftCard.expires_at,
    expired: giftCard.expired,
    active: giftCard.active,
  }
}

function mapShippingDiscountTotal(cart: SpreeCart | SpreeOrder): Money | null {
  const fulfillments = readFulfillments(cart)

  if (fulfillments.some((fulfillment) => fulfillment.discount_total === null)) {
    return null
  }

  return fulfillments.reduce<Money | null>(
    (total, fulfillment) => {
      if (!total) {
        return null
      }

      const discountTotal = mapSpreeAmountToMoney(
        fulfillment.discount_total,
        cart.currency,
      )

      if (!discountTotal) {
        return null
      }

      return {
        amount: total.amount + discountTotal.amount,
        currencyCode: total.currencyCode,
      }
    },
    {
      amount: 0,
      currencyCode: cart.currency,
    },
  )
}

export function mapSpreeCartToSummary(
  cart: SpreeCart | SpreeOrder,
): CartSummary {
  return {
    id: cart.id,
    itemCount: cart.total_quantity,
    currencyCode: cart.currency,
    currentStep: hasCartCheckoutFields(cart) ? cart.current_step : null,
    completedSteps: hasCartCheckoutFields(cart) ? cart.completed_steps : [],
    items: cart.items.map(mapLineItem),
    shippingRates: mapShippingRates(cart),
    appliedDiscounts: cart.discounts.map((discount) =>
      mapAppliedDiscount(discount, cart.currency),
    ),
    appliedGiftCard: mapAppliedGiftCard(cart),
    itemTotal: mapSpreeAmountToMoney(cart.item_total, cart.currency),
    discountTotal: mapSpreeAmountToMoney(cart.discount_total, cart.currency),
    deliveryTotal: mapSpreeAmountToMoney(cart.delivery_total, cart.currency),
    shippingDiscountTotal: mapShippingDiscountTotal(cart),
    taxTotal: mapSpreeAmountToMoney(cart.tax_total, cart.currency),
    total: mapSpreeAmountToMoney(cart.total, cart.currency),
  }
}
