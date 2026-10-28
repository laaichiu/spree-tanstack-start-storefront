import { Tag } from 'lucide-react'

import { Button, buttonClassName } from '@/components/ui/button'
import { CloseIcon } from '@/components/ui/close-icon'
import { Input } from '@/components/ui/input'

import type {
  CheckoutDiscountCodeFormActions,
  CheckoutDiscountCodeFormModel,
} from '../contracts/checkout'

export type {
  CheckoutAppliedCode,
  CheckoutDiscountCodeFormActions,
  CheckoutDiscountCodeFormModel,
} from '../contracts/checkout'

export function CheckoutDiscountCodeFormView({
  actions,
  model,
}: {
  actions: CheckoutDiscountCodeFormActions
  model: CheckoutDiscountCodeFormModel
}) {
  return (
    <form className="space-y-3" onSubmit={actions.submit}>
      {model.showCodeEntry && (
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Input
              className="h-14 bg-background px-4"
              disabled={model.isPending}
              error={model.codeError}
              label={model.codeLabel}
              labelClassName="sr-only"
              onChange={(event) => actions.codeChange(event.target.value)}
              placeholder={model.codeLabel}
              type="text"
              value={model.code}
            />
          </div>
          <button
            className={buttonClassName({
              className: 'h-14 border-border px-5',
              size: 'lg',
              variant: 'secondary',
            })}
            disabled={model.isApplyDisabled}
            type="submit"
          >
            {model.isPending ? model.applyingLabel : model.applyLabel}
          </button>
        </div>
      )}

      {model.appliedCodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {model.appliedCodes.map((appliedCode) => (
            <div
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
              key={appliedCode.id}
            >
              <div className="flex min-w-0 items-center gap-2 text-xs leading-5">
                <Tag
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-muted-foreground"
                />
                <span className="truncate font-normal text-foreground">
                  {appliedCode.label}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {appliedCode.amount}
                </span>
              </div>
              <Button
                variant="icon"
                aria-label={appliedCode.removeLabel}
                disabled={appliedCode.removing}
                onClick={() => actions.remove(appliedCode.id)}
                type="button"
              >
                <CloseIcon className="size-2" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {model.statusMessage && (
        <p aria-live="polite" className="sr-only" role="status">
          {model.statusMessage}
        </p>
      )}
    </form>
  )
}
