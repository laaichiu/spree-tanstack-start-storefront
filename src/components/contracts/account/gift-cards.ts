export type AccountGiftCardModel = {
  code: string
  detailLines: readonly string[]
  displayAmountRemaining?: string
  id: string
  remainingLabel: string
  statusLabel: string
}

export type AccountGiftCardDisplayLabels = {
  expiresOn: string
  noExpiration: string
  redeemedOn: string
  remaining: string
  totalAmount: string
  usedAmount: string
}

export type AccountGiftCardGroups = {
  active: readonly AccountGiftCardModel[]
  archived: readonly AccountGiftCardModel[]
}

export type AccountGiftCardsSectionLabels = {
  activeGiftCards: string
  archivedGiftCards: string
  giftCards: string
  giftCardsDescription: string
  giftCardsLoadFailed: string
  giftCardsLoadFailedDescription: string
  noGiftCards: string
  noGiftCardsDescription: string
}

export type AccountGiftCardsSectionModel =
  | {
      labels: AccountGiftCardsSectionLabels
      status: 'load-error'
    }
  | {
      cards: AccountGiftCardGroups
      labels: AccountGiftCardsSectionLabels
      status: 'ready'
    }
