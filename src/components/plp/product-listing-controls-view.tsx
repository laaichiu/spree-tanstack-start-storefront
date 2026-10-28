import { Sheet } from '@/components/ui/sheet'
import type { ProductListingControlsSlots } from '../contracts/catalog'

export type { ProductListingControlsSlots } from '../contracts/catalog'

type ProductListingControlsViewProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  slots: ProductListingControlsSlots
}

export function ProductListingControlsView({
  onOpenChange,
  open,
  slots,
}: ProductListingControlsViewProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open} swipeDirection="left">
      {slots.filterToolbar}
      {slots.filterDrawer}
    </Sheet>
  )
}
