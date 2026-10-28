import type { ReactNode, RefObject } from 'react'

export type FooterDeferredSlotModel = {
  hasLoadError: boolean
  retryLabel: string
}

export type FooterDeferredSlotSlots = {
  content: ReactNode
  fallback: ReactNode
}

export type FooterDeferredSlotProps = {
  model: FooterDeferredSlotModel
  onRetry: () => void
  slotRef: RefObject<HTMLDivElement | null>
  slots: FooterDeferredSlotSlots
}
