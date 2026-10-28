import type { ReactNode } from 'react'

export type DesktopMegaMenuNavigationActions = {
  cancelScheduledClose: () => void
  scheduleClose: () => void
}

export type DesktopMegaMenuPanelActions = {
  cancelScheduledClose: () => void
  close: () => void
  scheduleClose: () => void
}

export type DesktopMegaMenuPanelSlots = {
  featuredLink: ReactNode
  links: ReactNode
}

export type DesktopMegaMenuNavigationSlots = {
  links: ReactNode
  panel: ReactNode
}
