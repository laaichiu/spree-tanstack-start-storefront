import { ArrowRight } from 'lucide-react'
import type { FormEventHandler } from 'react'

import type {
  NewsletterEmailInputProps,
  NewsletterSignupFormModel,
} from './newsletter-form-types'

export type {
  NewsletterEmailInputProps,
  NewsletterSignupFormFeedback,
  NewsletterSignupFormModel,
} from './newsletter-form-types'

export function NewsletterSignupForm({
  emailInputProps,
  model,
  onSubmit,
}: {
  emailInputProps: NewsletterEmailInputProps
  model: NewsletterSignupFormModel
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <form className="mt-6" onSubmit={onSubmit}>
      <div
        data-disabled={model.isSubmitting}
        className="flex overflow-hidden border border-input bg-background text-foreground transition-colors motion-reduce:transition-none data-[disabled=false]:hover:not-focus-within:border-foreground/40 data-[disabled=false]:focus-within:border-foreground"
      >
        <label className="sr-only" htmlFor="footer-newsletter-email">
          {model.emailLabel}
        </label>
        <input
          autoComplete="email"
          className="h-14 min-w-0 flex-1 bg-background px-5 text-sm leading-4 font-normal uppercase text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
          disabled={model.isSubmitting}
          id="footer-newsletter-email"
          placeholder={model.emailPlaceholder.toUpperCase()}
          type="email"
          {...emailInputProps}
        />
        <button
          aria-label={model.submitLabel}
          className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={model.isSubmitting}
          type="submit"
        >
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div aria-live="polite" className="mt-3 min-h-5 text-xs leading-6">
        <p className={feedbackToneClassNames[model.feedback.tone]}>
          {model.feedback.text}
        </p>
      </div>
    </form>
  )
}

const feedbackToneClassNames = {
  error: 'text-destructive',
  hint: 'text-muted-foreground',
  success: 'text-foreground',
} satisfies Record<NewsletterSignupFormModel['feedback']['tone'], string>
