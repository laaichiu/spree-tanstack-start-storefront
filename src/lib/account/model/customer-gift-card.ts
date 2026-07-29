export type CustomerGiftCard = {
  active: boolean
  amount: string | null
  amountAuthorized: string | null
  amountRemaining: string | null
  amountUsed: string | null
  code: string
  currency: string
  displayAmount: string | null
  displayAmountRemaining: string | null
  displayAmountUsed: string | null
  expired: boolean
  expiresAt: string | null
  id: string
  redeemedAt: string | null
  status: string
}
