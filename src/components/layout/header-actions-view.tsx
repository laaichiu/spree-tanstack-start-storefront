import type { HeaderActionsSlots } from '../contracts/layout'

export type { HeaderActionsSlots } from '../contracts/layout'

export function HeaderActionsView({ slots }: { slots: HeaderActionsSlots }) {
  return (
    <div className="ml-auto flex items-center justify-end gap-6 xl:gap-0 xl:ml-0 xl:justify-self-end">
      {slots.desktopSearch}
      {slots.mobileSearch}
      {slots.desktopAccount}
      {slots.mobileAccount}
      {slots.desktopCart}
      {slots.mobileCart}
    </div>
  )
}
