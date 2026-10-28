export type CartErrorStateModel = {
  actionLabel: string
  description: string
  error: string | null
  isPending: boolean
  pendingActionLabel: string
  title: string
}

export type CartEmptyStateModel = {
  description: string
  policyLabel: string
  shopLabel: string
  title: string
}
