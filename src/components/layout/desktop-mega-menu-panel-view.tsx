import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import type {
  DesktopMegaMenuPanelActions,
  DesktopMegaMenuPanelSlots,
} from '../contracts/layout'

export type {
  DesktopMegaMenuPanelActions,
  DesktopMegaMenuPanelSlots,
} from '../contracts/layout'

export function DesktopMegaMenuPanelView({
  actions,
  activePanelId,
  closeLabel,
  hasFeaturedImage,
  panelRef,
  slots,
  title,
}: {
  actions: DesktopMegaMenuPanelActions
  activePanelId: string
  closeLabel: string
  hasFeaturedImage: boolean
  panelRef: RefObject<HTMLDivElement | null>
  slots: DesktopMegaMenuPanelSlots
  title: string
}) {
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <>
      <button
        aria-label={closeLabel}
        className="fixed inset-x-0 top-20 bottom-0 z-40 cursor-default bg-black/40"
        onClick={actions.close}
        type="button"
      />
      <div
        aria-label={title}
        className="fixed inset-x-0 top-20 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-b border-border bg-background"
        id={activePanelId}
        onMouseEnter={actions.cancelScheduledClose}
        onMouseLeave={actions.scheduleClose}
        onPointerEnter={actions.cancelScheduledClose}
        onPointerLeave={actions.scheduleClose}
        ref={panelRef}
        role="region"
      >
        <div aria-hidden="true" className="h-px w-full bg-border" />
        <div className="mx-auto flex max-w-[min(100vw-3rem,88rem)] justify-center px-8 py-10 xl:px-12">
          <div
            className={
              hasFeaturedImage
                ? 'grid items-start grid-cols-[minmax(14rem,19rem)_17rem] gap-x-24'
                : 'grid items-start grid-cols-[minmax(14rem,19rem)]'
            }
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {title}
              </p>
              <nav aria-label={title} className="mt-5 space-y-3.5">
                {slots.links}
              </nav>
            </div>

            {hasFeaturedImage && slots.featuredLink}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
