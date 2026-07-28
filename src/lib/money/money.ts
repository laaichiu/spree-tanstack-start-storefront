export type Money = {
  amount: number
  currencyCode: string
}

export function hasMeaningfulMoney(value: number | string) {
  const amount = Number(value)

  return Number.isFinite(amount) && Math.abs(amount) > 0.0001
}
