import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { SheetHandle } from '@/components/ui/sheet'
import type {
  CartDrawerShellActions,
  CartDrawerShellSlots,
} from '@/components/contracts/cart'

export type { CartDrawerShellSlots } from '@/components/contracts/cart'

type CartDrawerShellViewProps = {
  actions: CartDrawerShellActions
  handle: SheetHandle
  open: boolean
  slots: CartDrawerShellSlots
  triggerId: string | null
}

export function CartDrawerShellView({
  actions,
  handle,
  open,
  slots,
  triggerId,
}: CartDrawerShellViewProps) {
  return (
    <Sheet
      handle={handle}
      onOpenChange={(nextOpen, eventDetails) =>
        actions.openChange(nextOpen, eventDetails.trigger?.id ?? null)
      }
      open={open}
      triggerId={triggerId}
    >
      <SheetContent className="max-lg:landscape:min-h-0" disableSwipe>
        {slots.header}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {slots.body}
          </div>
          {slots.footer}
        </div>
      </SheetContent>
    </Sheet>
  )
}
