import type { FormEventHandler, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { DialogContent, DialogRoot } from '@/components/ui/dialog'
import type { AccountAddressFormDialogModel } from '@/components/contracts/account'

export type { AccountAddressFormDialogModel } from '@/components/contracts/account'

export function AccountAddressFormDialogView({
  children,
  model,
  onOpenChange,
  onSubmit,
}: {
  children: ReactNode
  model: AccountAddressFormDialogModel
  onOpenChange: (open: boolean) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={model.open}>
      <DialogContent
        className="max-w-3xl"
        closeLabel={model.closeLabel}
        description={model.description}
        title={model.title}
      >
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          {children}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              disabled={model.isPending}
              onClick={() => onOpenChange(false)}
              size="lg"
              type="button"
              variant="secondary"
            >
              {model.cancelLabel}
            </Button>
            <Button disabled={model.isPending} size="lg" type="submit">
              {model.isPending ? model.savingLabel : model.saveLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
