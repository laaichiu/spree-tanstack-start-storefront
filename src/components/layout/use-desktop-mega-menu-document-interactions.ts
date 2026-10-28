import type { MutableRefObject, RefObject } from 'react'
import { useEffect } from 'react'

function isInsideMenu(
  target: EventTarget | null,
  rootRef: RefObject<HTMLDivElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  if (!(target instanceof Node)) {
    return false
  }

  return Boolean(
    rootRef.current?.contains(target) || panelRef.current?.contains(target),
  )
}

export function useDesktopMegaMenuDocumentInteractions({
  activeItemId,
  closeMenu,
  panelRef,
  rootRef,
  suppressFocusOpenRef,
  triggerRefs,
}: {
  activeItemId: string | null
  closeMenu: () => void
  panelRef: RefObject<HTMLDivElement | null>
  rootRef: RefObject<HTMLDivElement | null>
  suppressFocusOpenRef: MutableRefObject<boolean>
  triggerRefs: MutableRefObject<Map<string, HTMLAnchorElement>>
}) {
  useEffect(() => {
    if (!activeItemId) {
      return
    }

    const openItemId = activeItemId

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'ArrowDown' &&
        document.activeElement === triggerRefs.current.get(openItemId)
      ) {
        const firstLink =
          panelRef.current?.querySelector<HTMLAnchorElement>('a[href]')
        if (firstLink) {
          event.preventDefault()
          firstLink.focus()
        }
        return
      }

      if (event.key !== 'Escape') {
        return
      }

      suppressFocusOpenRef.current = true
      closeMenu()
      triggerRefs.current.get(openItemId)?.focus()
      window.setTimeout(() => {
        suppressFocusOpenRef.current = false
      }, 0)
    }

    function handlePointerDown(event: PointerEvent) {
      if (!isInsideMenu(event.target, rootRef, panelRef)) {
        closeMenu()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isInsideMenu(event.target, rootRef, panelRef)) {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [
    activeItemId,
    closeMenu,
    panelRef,
    rootRef,
    suppressFocusOpenRef,
    triggerRefs,
  ])
}
