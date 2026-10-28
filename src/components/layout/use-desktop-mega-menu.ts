import { useCallback, useEffect, useRef, useState } from 'react'

import { useDesktopMegaMenuDocumentInteractions } from './use-desktop-mega-menu-document-interactions'

const MENU_CLOSE_DELAY_MS = 140

type DesktopMegaMenuItem = {
  hasPanel: boolean
  id: string
}

type DesktopMegaMenuState = {
  activeItemId: string | null
  cancelScheduledClose: () => void
  closeMenu: () => void
  handleItemEnter: (item: DesktopMegaMenuItem) => void
  panelRef: React.RefObject<HTMLDivElement | null>
  rootRef: React.RefObject<HTMLDivElement | null>
  scheduleClose: () => void
  triggerRefs: React.MutableRefObject<Map<string, HTMLAnchorElement>>
}

export function useDesktopMegaMenu(): DesktopMegaMenuState {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const suppressFocusOpenRef = useRef(false)
  const triggerRefs = useRef(new Map<string, HTMLAnchorElement>())

  const closeMenu = useCallback(() => {
    setActiveItemId(null)
  }, [])

  const handleItemEnter = useCallback(
    (item: DesktopMegaMenuItem) => {
      if (suppressFocusOpenRef.current) {
        return
      }

      if (item.hasPanel) {
        setActiveItemId(item.id)
        return
      }

      closeMenu()
    },
    [closeMenu],
  )

  const cancelScheduledClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelScheduledClose()
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      closeMenu()
    }, MENU_CLOSE_DELAY_MS)
  }, [cancelScheduledClose, closeMenu])

  useDesktopMegaMenuDocumentInteractions({
    activeItemId,
    closeMenu,
    panelRef,
    rootRef,
    suppressFocusOpenRef,
    triggerRefs,
  })

  useEffect(() => {
    return () => cancelScheduledClose()
  }, [cancelScheduledClose])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 80rem)')
    function handleChange() {
      if (!desktop.matches) closeMenu()
    }
    desktop.addEventListener('change', handleChange)
    return () => desktop.removeEventListener('change', handleChange)
  }, [closeMenu])

  return {
    activeItemId,
    cancelScheduledClose,
    closeMenu,
    handleItemEnter,
    panelRef,
    rootRef,
    scheduleClose,
    triggerRefs,
  }
}
