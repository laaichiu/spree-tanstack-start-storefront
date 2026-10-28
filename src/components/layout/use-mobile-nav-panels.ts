import { flushSync } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  MobileNavPanel,
  MobileNavPanelsActions,
  MobileNavPanelsController,
  MobileNavPanelsState,
} from '../contracts/layout'

export type {
  MobileNavPanel,
  MobileNavPanelsActions,
  MobileNavPanelsController,
  MobileNavPanelsState,
} from '../contracts/layout'

const PANEL_TRANSITION_MS = 320

export function useMobileNavPanels<TCategory>({
  open,
  resetKey,
}: {
  open: boolean
  resetKey?: string
}): MobileNavPanelsController<TCategory> {
  const [panelStack, setPanelStack] = useState<MobileNavPanel<TCategory>[]>([
    { kind: 'main' },
  ])
  const [animatedIndex, setAnimatedIndex] = useState(0)
  const [isPopping, setIsPopping] = useState(false)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const cancelPendingCallbacks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetPanels = useCallback(() => {
    cancelPendingCallbacks()
    setPanelStack([{ kind: 'main' }])
    setAnimatedIndex(0)
    setIsPopping(false)
  }, [cancelPendingCallbacks])

  const pushPanel = useCallback(
    (panel: MobileNavPanel<TCategory>) => {
      if (timeoutRef.current !== null) {
        return
      }

      cancelPendingCallbacks()
      setIsPopping(false)
      flushSync(() => {
        setPanelStack((previous) => [...previous, panel])
      })

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setAnimatedIndex((previous) => previous + 1)
      })
    },
    [cancelPendingCallbacks],
  )

  const popPanel = useCallback(() => {
    if (panelStack.length <= 1 || timeoutRef.current !== null) {
      return
    }

    cancelPendingCallbacks()
    setIsPopping(true)
    setAnimatedIndex((previous) => Math.max(0, previous - 1))
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      setPanelStack((previous) =>
        previous.length > 1 ? previous.slice(0, -1) : previous,
      )
      setIsPopping(false)
    }, PANEL_TRANSITION_MS)
  }, [cancelPendingCallbacks, panelStack.length])

  useEffect(() => {
    resetPanels()
  }, [open, resetKey, resetPanels])

  useEffect(() => {
    return () => cancelPendingCallbacks()
  }, [cancelPendingCallbacks])

  const state: MobileNavPanelsState<TCategory> = {
    animatedIndex,
    isPopping,
    panelStack,
  }
  const actions: MobileNavPanelsActions<TCategory> = {
    popPanel,
    pushPanel,
  }

  return { actions, state }
}
