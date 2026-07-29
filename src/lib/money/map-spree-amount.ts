import type { Money } from './money'

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

  const parsedAmount = Number.parseFloat(amount)

  if (!Number.isFinite(parsedAmount)) {
    throw new Error('Spree money amount is invalid')
  }

  return {
    amount: parsedAmount,
    currencyCode,
  }
}
