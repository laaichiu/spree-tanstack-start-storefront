import type { RefObject } from 'react'
import type {
  DesktopMegaMenuNavigationActions,
  DesktopMegaMenuNavigationSlots,
} from '../contracts/layout'

export type {
  DesktopMegaMenuNavigationActions,
  DesktopMegaMenuNavigationSlots,
} from '../contracts/layout'

export function DesktopMegaMenuNavigationView({
  actions,
  navLabel,
  rootRef,
  slots,
}: {
  actions: DesktopMegaMenuNavigationActions
  navLabel: string
  rootRef: RefObject<HTMLDivElement | null>
  slots: DesktopMegaMenuNavigationSlots
}) {
  return (
    <div className="hidden min-w-0 xl:block" ref={rootRef}>
      <nav
        aria-label={navLabel}
        className="flex h-full min-w-0 items-stretch gap-2 2xl:gap-5"
        onMouseEnter={actions.cancelScheduledClose}
        onMouseLeave={actions.scheduleClose}
        onPointerEnter={actions.cancelScheduledClose}
        onPointerLeave={actions.scheduleClose}
      >
        {slots.links}
      </nav>
      {slots.panel}
    </div>
  )
}
