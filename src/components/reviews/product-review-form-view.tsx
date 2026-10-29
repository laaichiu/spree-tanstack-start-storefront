import { CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductReviewFormProps } from '../contracts/reviews'
import { ReviewStarIcon } from './review-star-icon'

export type {
  ProductReviewFormActions,
  ProductReviewFormLabels,
  ProductReviewFormModel,
  ProductReviewFormProps,
  ProductReviewFormReadyActions,
  ProductReviewFormReadySlots,
  ProductReviewFormState,
} from '../contracts/reviews'

export function ProductReviewFormView({ ...props }: ProductReviewFormProps) {
  const { labels, state } = props.model
  if (state.status === 'loading') {
    return (
      <p className="py-4 text-xs text-muted-foreground" role="status">
        {labels.loadingForm}
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="py-4 text-xs text-destructive" role="alert">
        {labels.eligibilityFailed}
      </p>
    )
  }

  if (state.status === 'ineligible') {
    return (
      <div className="flex items-center justify-between gap-4 py-4">
        <p className="text-xs text-muted-foreground">{state.message}</p>
        <Button onClick={props.actions.cancel} size="sm" variant="ghost">
          {labels.cancel}
        </Button>
      </div>
    )
  }

  if (state.status === 'submitted') {
    return (
      <div
        className="flex gap-3 py-4 text-xs text-muted-foreground"
        role="status"
      >
        <CheckCircle
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
        />
        <div>
          <p className="font-normal text-foreground">{labels.submitted}</p>
          <p className="mt-1 leading-6">{labels.submittedDescription}</p>
        </div>
      </div>
    )
  }

  if (!isReadyFormProps(props)) {
    return null
  }

  return (
    <form className="space-y-6 pt-5" onSubmit={props.actions.submit}>
      <div>
        <p className="text-xs leading-4 font-normal uppercase text-foreground">
          {labels.ratingLabel}
        </p>
        <div className="mt-2 flex h-10 items-center gap-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              variant="icon"
              aria-label={`${value} / 5`}
              aria-pressed={state.rating === value}
              key={value}
              onClick={() => props.actions.ratingChange(value)}
              type="button"
            >
              <ReviewStarIcon
                className="h-5 w-5"
                filled={value <= state.rating}
              />
            </Button>
          ))}
        </div>
      </div>

      <Input
        label={labels.titleLabel}
        maxLength={120}
        onChange={(event) =>
          props.actions.titleChange(event.currentTarget.value)
        }
        value={state.title}
      />

      <label className="block">
        <span className="mb-2 block text-xs leading-4 font-normal uppercase text-foreground">
          {labels.bodyLabel}
        </span>
        <textarea
          className="min-h-32 w-full resize-y rounded-sm border border-input bg-background px-3 py-3 text-base leading-6 text-foreground outline-none transition-colors motion-reduce:transition-none placeholder:text-muted-foreground enabled:hover:not-focus:border-foreground/40 focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          maxLength={10_000}
          onChange={(event) =>
            props.actions.bodyChange(event.currentTarget.value)
          }
          placeholder={labels.bodyPlaceholder}
          value={state.body}
        />
      </label>

      {props.slots.questionFields}
      {props.slots.mediaPicker}

      {state.error ? (
        <p className="text-xs leading-6 text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={state.submitting} type="submit">
          {state.submitting ? labels.submitting : labels.submit}
        </Button>
        <Button
          disabled={state.submitting}
          onClick={props.actions.cancel}
          type="button"
          variant="secondary"
        >
          {labels.cancel}
        </Button>
      </div>
    </form>
  )
}

function isReadyFormProps(
  props: ProductReviewFormProps,
): props is Extract<
  ProductReviewFormProps,
  { model: { state: { status: 'ready' } } }
> {
  return props.model.state.status === 'ready'
}
