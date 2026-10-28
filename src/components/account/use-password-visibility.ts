import { useCallback, useState } from 'react'

export function usePasswordVisibility() {
  const [isVisible, setIsVisible] = useState(false)

  const toggle = useCallback(() => {
    setIsVisible((current) => !current)
  }, [])

  return { isVisible, toggle }
}
