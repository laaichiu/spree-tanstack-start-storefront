import { getDiscountPercent } from '@/lib/core/money'
import type { Money } from '@/lib/core/money'

export type MoneyDisplay = {
  compareAtPriceLabel: string | null
  priceLabel: string
}

const moneyFormatters = new Map<string, Intl.NumberFormat>()

type MoneyFormatOptions = Pick<
  Intl.NumberFormatOptions,
  'maximumFractionDigits' | 'minimumFractionDigits'
> & { unitPrice?: boolean }

export function formatMoney(
  money: Money | null | undefined,
  locale = 'en-US',
  options: MoneyFormatOptions = {},
): string {
  if (!money) {
    return '—'
  }

  const { unitPrice = false, ...fractionOptions } = options
  const formatterKey = [
    locale,
    money.currencyCode,
    unitPrice,
    options.minimumFractionDigits ?? 'default',
    options.maximumFractionDigits ?? 'default',
  ].join(':')
  let formatter = moneyFormatters.get(formatterKey)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currencyCode,
      ...(unitPrice ? { maximumFractionDigits: 4 } : {}),
      ...fractionOptions,
    })
    moneyFormatters.set(formatterKey, formatter)
  }

  return formatter.format(money.amount)
}

export function getMoneyDisplay(
  price: Money | null | undefined,
  compareAtPrice: Money | null | undefined,
  locale = 'en-US',
  options: MoneyFormatOptions = {},
): MoneyDisplay {
  return {
    compareAtPriceLabel:
      getDiscountPercent(price, compareAtPrice) === null
        ? null
        : formatMoney(compareAtPrice, locale, options),
    priceLabel: formatMoney(price, locale, options),
  }
}
