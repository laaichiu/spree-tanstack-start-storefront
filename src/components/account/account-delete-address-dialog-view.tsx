import { Button } from '@/components/ui/button'
import { DialogContent, DialogRoot } from '@/components/ui/dialog'

import type { AccountDeleteAddressDialogModel } from '@/components/contracts/account'

export type { AccountDeleteAddressDialogModel } from '@/components/contracts/account'

export function AccountDeleteAddressDialogView({
  model,
  onConfirm,
  onOpenChange,
}: {
  model: AccountDeleteAddressDialogModel
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={Boolean(model.address)}>
      <DialogContent
        className="max-w-xl"
        closeLabel={model.closeLabel}
        description={model.description}
        title={model.title}
      >
        {model.address && (
          <div className="mt-8 border border-border bg-muted p-4 text-xs leading-6 text-muted-foreground">
            <p className="font-normal text-foreground">
              {model.address.fullName}
            </p>
            {model.address.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={model.isPending}
            onClick={() => onOpenChange(false)}
            size="lg"
            type="button"
            variant="secondary"
          >
            {model.cancelLabel}
          </Button>
          <Button
            disabled={model.isPending}
            onClick={onConfirm}
            size="lg"
            type="button"
            variant="danger"
          >
            {model.isPending ? model.removingLabel : model.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
