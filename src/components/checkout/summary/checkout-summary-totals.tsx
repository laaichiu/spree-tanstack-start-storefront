import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { ProductPrice } from '@/components/shared/product-price'
import type { CartSummary } from '@/lib/cart/model/cart'
import {
  getAppliedCheckoutCreditAmount,
  getCheckoutAmountDue,
  getCheckoutDiscountBreakdown,
} from '@/lib/checkout/utils/summary/checkout-summary-amounts'
import { formatMoney } from '@/lib/money/format-money'
import type { Money } from '@/lib/money/money'
import { cn } from '@/lib/utils'

import { CheckoutDiscountCodeForm } from '../code/checkout-discount-code-form'

function hasNegativeAmount(price: Money | null) {
  return price?.amount != null && price.amount < 0
}

function hasPositiveAmount(price: Money | null) {
  return price?.amount != null && price.amount > 0
}

function CheckoutSummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm leading-5">
      <span className="text-muted-foreground">{label}</span>
      <div className={cn('text-right text-foreground', valueClassName)}>
        {value}
      </div>
    </div>
  )
}

function CheckoutSummaryDetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 pl-4 text-sm leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  )
}

export function CheckoutSummaryTotals({ cart }: { cart: CartSummary }) {
  const { market, t } = useMarket()
  const selectedShippingRate = cart.shippingRates.find((rate) => rate.selected)
  const amountDue = getCheckoutAmountDue(cart)
  const appliedCheckoutCreditAmount = getAppliedCheckoutCreditAmount(cart)
  const removableDiscountCount = cart.appliedDiscounts.filter(
    (discount) => discount.code,
  ).length
  const discountBreakdown = getCheckoutDiscountBreakdown(cart, {
    additionalDiscount: t('checkout.additionalDiscount'),
    discount: t('cart.discount'),
    freeShipping: t('checkout.freeShipping'),
  })
  const showDiscountBreakdown =
    discountBreakdown.length > removableDiscountCount
  const shippingSummary = selectedShippingRate ? (
    <ProductPrice price={cart.deliveryTotal} variant="listing" />
  ) : (
    t('checkout.enterShippingAddress')
  )

  return (
    <div className="space-y-3 pt-6">
      <CheckoutDiscountCodeForm cart={cart} />

      <div className="space-y-3 pt-5">
        <CheckoutSummaryRow
          label={t('cart.subtotal')}
          value={<ProductPrice price={cart.itemTotal} variant="listing" />}
        />
        <CheckoutSummaryRow
          label={t('cart.shipping')}
          value={shippingSummary}
        />
        {hasNegativeAmount(cart.discountTotal) ? (
          <>
            <CheckoutSummaryRow
              label={t('cart.discount')}
              value={formatMoney(cart.discountTotal, market.locale)}
              valueClassName="text-green-700"
            />
            {showDiscountBreakdown ? (
              <div className="space-y-1">
                {discountBreakdown.map((discount) => (
                  <CheckoutSummaryDetailRow
                    key={discount.id}
                    label={discount.label}
                    value={formatMoney(discount.amount, market.locale)}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        {hasPositiveAmount(cart.taxTotal) ? (
          <CheckoutSummaryRow
            label={t('cart.tax')}
            value={<ProductPrice price={cart.taxTotal} variant="listing" />}
          />
        ) : null}
        {appliedCheckoutCreditAmount ? (
          <CheckoutSummaryRow
            label={t('checkout.giftCardOrStoreCredit')}
            value={
              <ProductPrice
                price={appliedCheckoutCreditAmount}
                variant="listing"
              />
            }
            valueClassName="text-foreground"
          />
        ) : null}

        <div className="pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-lg leading-6 font-normal text-foreground">
              {t('cart.total')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm tracking-wider text-muted-foreground uppercase">
                {cart.currencyCode}
              </span>
              <span className="text-2xl leading-none text-foreground">
                {formatMoney(cart.total, market.locale)}
              </span>
            </div>
          </div>
          {amountDue && cart.total && amountDue.amount !== cart.total.amount ? (
            <div className="mt-3 flex items-baseline justify-between gap-4 text-sm leading-5">
              <span className="text-muted-foreground">
                {t('checkout.amountDue')}
              </span>
              <span className="text-foreground">
                {formatMoney(amountDue, market.locale)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
