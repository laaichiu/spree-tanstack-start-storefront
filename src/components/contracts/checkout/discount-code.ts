import type { FormEvent } from 'react'
import type { CheckoutAppliedCodePresentation } from '@/components/checkout/code/checkout-applied-code-display'

export type CheckoutAppliedCode = Omit<
  CheckoutAppliedCodePresentation,
  'code' | 'kind'
> & {
  removeLabel: string
  removing: boolean
}

export type CheckoutDiscountCodeFormModel = {
  appliedCodes: readonly CheckoutAppliedCode[]
  applyLabel: string
  applyingLabel: string
  code: string
  codeError: string | null
  codeLabel: string
  isApplyDisabled: boolean
  isPending: boolean
  showCodeEntry: boolean
  statusMessage: string | null
}

export type CheckoutDiscountCodeFormActions = {
  codeChange: (code: string) => void
  remove: (codeId: string) => void
  submit: (event: FormEvent<HTMLFormElement>) => void
}
