export type CustomerCreditCard = {
  brand: string
  default: boolean
  expiryMonth: number
  expiryYear: number
  gatewayPaymentProfileId: string | null
  id: string
  last4: string
  name: string | null
}
