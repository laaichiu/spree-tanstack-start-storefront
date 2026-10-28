import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'

import { reportError } from '../../observability/report-error'

export type DeferredModuleLoader<TProps> = () => Promise<{
  default: ComponentType<TProps>
}>

function useDeferredLoadTrigger() {
  const [shouldLoad, setShouldLoad] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const slot = slotRef.current

    if (!slot) {
      setShouldLoad(true)
      return
    }

    if (typeof window.IntersectionObserver !== 'function') {
      setShouldLoad(true)
      return
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '480px 0px' },
    )

    observer.observe(slot)

    return () => observer.disconnect()
  }, [])

  return { shouldLoad, slotRef }
}

export function useDeferredModule<TProps>({
  load,
  moduleName,
}: {
  load: DeferredModuleLoader<TProps>
  moduleName: string
}) {
  const { shouldLoad, slotRef } = useDeferredLoadTrigger()
  const [Component, setComponent] = useState<ComponentType<TProps> | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!shouldLoad) {
      return
    }

    let cancelled = false
    setHasLoadError(false)

    void load().then(
      ({ default: LoadedComponent }) => {
        if (cancelled) {
          return
        }

        setComponent(() => LoadedComponent)
      },
      (error: unknown) => {
        if (cancelled) {
          return
        }

        reportError({
          context: `layout.${moduleName}`,
          error,
        })
        setHasLoadError(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [load, moduleName, retryCount, shouldLoad])

  function retry() {
    setComponent(null)
    setHasLoadError(false)
    setRetryCount((count) => count + 1)
  }

  return {
    Component,
    hasLoadError,
    retry,
    slotRef,
  }
}
