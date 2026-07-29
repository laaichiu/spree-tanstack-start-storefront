import type { Money } from './money'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

type MoneyFormatOptions = Pick<
  Intl.NumberFormatOptions,
  'maximumFractionDigits' | 'minimumFractionDigits'
>

export function formatMoney(
  money: Money | null | undefined,
  locale = 'en-US',
  options: MoneyFormatOptions = {},
): string {
  if (!money) {
    return '—'
  }

  const formatterKey = [
    locale,
    money.currencyCode,
    options.minimumFractionDigits ?? 'default',
    options.maximumFractionDigits ?? 'default',
  ].join(':')
  let formatter = moneyFormatters.get(formatterKey)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currencyCode,
      ...options,
    })
    moneyFormatters.set(formatterKey, formatter)
  }

  return formatter.format(money.amount)
}
