import { useCallback, useState } from 'react'
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

  const handleOpenChange = useCallback<HeaderDrawerOpenChange>(
    (nextOpen, nextTriggerId) => {
      setOpen(nextOpen)

      if (nextOpen) {
        setTriggerId(nextTriggerId ?? null)
      }
    },
    [],
  )
  const mountClosed = useCallback(() => setIsMounted(true), [])
  const openFromTrigger = useCallback<SheetTriggerClick>((event) => {
    event.preventBaseUIHandler()
    setTriggerId(event.currentTarget.id)
    setIsMounted(true)
    setOpen(true)
  }, [])
  const openProgrammatically = useCallback(() => {
    setTriggerId(null)
    setIsMounted(true)
    setOpen(true)
  }, [])

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
    handleOpenChange,
    isMounted,
    mountClosed,
    open,
    openProgrammatically,
    triggerId,
  }
}
