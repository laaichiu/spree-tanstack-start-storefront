import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { createSheetHandle } from '@/components/ui/sheet'
import type { SheetTrigger } from '@/components/ui/sheet'

type HeaderDrawerOpenChange = (open: boolean, triggerId?: string | null) => void
type SheetTriggerClick = NonNullable<
  ComponentPropsWithoutRef<typeof SheetTrigger>['onClick']
>

export function useLazyHeaderDrawer() {
  const [handle] = useState(() => createSheetHandle())
  const [isMounted, setIsMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [triggerId, setTriggerId] = useState<string | null>(null)
  const pendingOpenRef = useRef(false)
  const openFrameRef = useRef<number | null>(null)

  const handleOpenChange = useCallback<HeaderDrawerOpenChange>(
    (nextOpen, nextTriggerId) => {
      if (!nextOpen && open) {
        pendingOpenRef.current = false
      }

      setOpen(nextOpen)

      if (nextOpen) {
        setTriggerId(nextTriggerId ?? null)
      }
    },
    [open],
  )
  const openFromTrigger = useCallback<SheetTriggerClick>(
    (event) => {
      event.preventBaseUIHandler()
      setTriggerId(event.currentTarget.id)

      if (isMounted) {
        setOpen(true)
        return
      }

      pendingOpenRef.current = true
      setIsMounted(true)
    },
    [isMounted],
  )
  const openProgrammatically = useCallback(() => {
    setTriggerId(null)

    if (isMounted) {
      setOpen(true)
      return
    }

    pendingOpenRef.current = true
    setIsMounted(true)
  }, [isMounted])
  const handleMount = useCallback(() => {
    if (!pendingOpenRef.current || openFrameRef.current !== null) {
      return
    }

    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = null

      if (pendingOpenRef.current) {
        pendingOpenRef.current = false
        setOpen(true)
      }
    })
  }, [])

  useEffect(
    () => () => {
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current)
      }
    },
    [],
  )

  function getTriggerProps(nextTriggerId: string) {
    return {
      handle,
      id: nextTriggerId,
      onClick: openFromTrigger,
    }
  }

  return {
    getTriggerProps,
    handle,
    handleMount,
    handleOpenChange,
    isMounted,
    open,
    openProgrammatically,
    triggerId,
  }
}
