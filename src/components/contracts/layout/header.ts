import type { ReactNode } from 'react'

export type HeaderSlots = {
  actions: ReactNode
  announcement: ReactNode
  brand: ReactNode
  desktopNavigation: ReactNode
  mobileNavigation: ReactNode
}

export type HeaderActionsSlots = {
  desktopAccount: ReactNode
  desktopCart: ReactNode
  desktopSearch: ReactNode
  mobileAccount: ReactNode
  mobileCart: ReactNode
  mobileSearch: ReactNode
}

export type HeaderProps = {
  slots: HeaderSlots
}
