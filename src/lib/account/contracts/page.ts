export type AccountSection =
  'addresses' | 'giftCards' | 'orders' | 'paymentMethods' | 'profile'

export type AccountPageModel = {
  account: {
    displayName: string
    email: string
  }
  activeSection: AccountSection
}
