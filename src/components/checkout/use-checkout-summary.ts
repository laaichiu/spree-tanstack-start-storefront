import { useCallback, useState } from 'react'

export function useCheckoutSummary() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((current) => !current)
  }, [])

  return { isMobileOpen, toggleMobile }
}
