import { ArrowRight } from 'lucide-react'
import type { FormEventHandler } from 'react'

import type {
  NewsletterEmailInputProps,
  NewsletterPopupFormModel,
} from './newsletter-form-types'

export type { NewsletterPopupFormModel } from './newsletter-form-types'

export function NewsletterPopupForm({
  emailInputProps,
  model,
  onSubmit,
}: {
  emailInputProps: NewsletterEmailInputProps
  model: NewsletterPopupFormModel
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <form className="mt-2 space-y-2" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="newsletter-popup-email">
        {model.emailLabel}
      </label>
      <input
        autoComplete="email"
        className="mt-2 h-12 w-full border border-input bg-background px-4 text-base text-foreground outline-none transition-colors motion-reduce:transition-none placeholder:text-muted-foreground enabled:hover:not-focus:border-foreground/40 focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        disabled={model.isSubmitting}
        id="newsletter-popup-email"
        placeholder={model.emailPlaceholder}
        type="email"
        {...emailInputProps}
      />

      <div aria-live="polite" className="min-h-1">
        {model.errorMessage && (
          <p className="text-xs text-destructive">{model.errorMessage}</p>
        )}
      </div>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 bg-foreground px-5 text-xs font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={model.isSubmitting}
        type="submit"
      >
        {model.isSubmitting ? model.submittingLabel : model.submitLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </form>
  )
}
