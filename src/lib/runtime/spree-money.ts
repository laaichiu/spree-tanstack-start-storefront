import { formatMoney } from '@spree/sdk'

import { isDecimalMoneyAmount } from '@/lib/core/decimal-money'

export type MoneyDisplayContext = {
  currencyCode: string
  locale: string
}

export function formatSpreeMoney(
  amount: string | null,
  { currencyCode, locale }: MoneyDisplayContext,
  options: { unitPrice?: boolean } = {},
): string | null {
  if (amount === null) return null
  if (!isDecimalMoneyAmount(amount))
    throw new Error('The money response is malformed.')

  const formatted = formatMoney(amount, currencyCode, locale, options)
  if (!formatted) throw new Error('The money response is malformed.')
  return formatted
}
