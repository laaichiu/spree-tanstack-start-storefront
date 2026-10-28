import type { Money } from '@/lib/core/money'
import { isDecimalMoneyAmount } from '@/lib/core/decimal-money'

export function mapSpreeAmountToMoney(
  amount: string,
  currencyCode: string,
): Money
export function mapSpreeAmountToMoney(
  amount: string | null,
  currencyCode: string,
): Money | null
export function mapSpreeAmountToMoney(
  amount: string | null,
  currencyCode: string,
): Money | null {
  if (amount === null) {
    return null
  }

  const normalizedAmount = amount.trim()
  const parsedAmount = Number(normalizedAmount)

  if (
    !isDecimalMoneyAmount(normalizedAmount) ||
    !Number.isFinite(parsedAmount)
  ) {
    throw new Error('Spree money amount is invalid')
  }

  return {
    amount: parsedAmount,
    currencyCode,
  }
}
