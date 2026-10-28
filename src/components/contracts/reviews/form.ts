import type { FormEventHandler, ReactNode } from 'react'

export type ProductReviewFormLabels = {
  bodyLabel: string
  bodyPlaceholder: string
  cancel: string
  eligibilityFailed: string
  loadingForm: string
  ratingLabel: string
  submit: string
  submitting: string
  submitted: string
  submittedDescription: string
  titleLabel: string
}

export type ProductReviewFormState =
  | { status: 'loading' }
  | { status: 'error' }
  | { message: string; status: 'ineligible' }
  | { status: 'submitted' }
  | {
      body: string
      error: string | null
      rating: number
      status: 'ready'
      submitting: boolean
      title: string
    }

export type ProductReviewFormModel = {
  labels: ProductReviewFormLabels
  state: ProductReviewFormState
}

export type ProductReviewFormActions = {
  cancel: () => void
}

export type ProductReviewFormReadyActions = ProductReviewFormActions & {
  bodyChange: (value: string) => void
  ratingChange: (rating: number) => void
  submit: FormEventHandler<HTMLFormElement>
  titleChange: (value: string) => void
}

export type ProductReviewFormReadySlots = {
  mediaPicker: ReactNode
  questionFields: ReactNode
}

type ProductReviewFormBaseProps = {
  actions: ProductReviewFormActions
}

type ProductReviewFormReadyState = Extract<
  ProductReviewFormState,
  { status: 'ready' }
>

type ProductReviewFormLifecycleState = Exclude<
  ProductReviewFormState,
  ProductReviewFormReadyState
>

export type ProductReviewFormProps =
  | (ProductReviewFormBaseProps & {
      actions: ProductReviewFormReadyActions
      model: {
        labels: ProductReviewFormLabels
        state: ProductReviewFormReadyState
      }
      slots: ProductReviewFormReadySlots
    })
  | (ProductReviewFormBaseProps & {
      model: {
        labels: ProductReviewFormLabels
        state: ProductReviewFormLifecycleState
      }
    })
