import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SheetHandle } from '@/components/ui/sheet'
import type { SearchDrawerShellSlots } from '../contracts/search'

export type { SearchDrawerShellSlots } from '../contracts/search'

export function SearchDrawerShellView({
  closeLabel,
  handle,
  open,
  onOpenChange,
  slots,
  title,
  triggerId,
}: {
  closeLabel: string
  handle: SheetHandle
  open: boolean
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  slots: SearchDrawerShellSlots
  title: string
  triggerId: string | null
}) {
  return (
    <Sheet
      handle={handle}
      onOpenChange={(nextOpen, eventDetails) =>
        onOpenChange(nextOpen, eventDetails.trigger?.id ?? null)
      }
      open={open}
      triggerId={triggerId}
    >
      <SheetContent disableSwipe>
        <SheetHeader className="min-h-18 justify-end px-5 pt-4 pb-5 sm:min-h-20 sm:px-6 sm:pt-5 sm:pb-6">
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetCloseButton aria-label={closeLabel} />
        </SheetHeader>
        {slots.form}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {slots.content}
        </div>
      </SheetContent>
    </Sheet>
  )
}
