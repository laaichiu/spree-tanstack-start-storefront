import type { ReactNode } from 'react'

export type MobileNavPanel<TCategory> =
  | { kind: 'main' }
  | { kind: 'brands' }
  | { category: TCategory; kind: 'category' }

export type MobileNavPanelsState<TCategory> = {
  animatedIndex: number
  isPopping: boolean
  panelStack: readonly MobileNavPanel<TCategory>[]
}

export type MobileNavMainPanelSlots = {
  accountLink: ReactNode
  brandLink: ReactNode
  categoryLinks: ReactNode
  marketSelector: ReactNode
}

export type MobileNavPanelsActions<TCategory> = {
  popPanel: () => void
  pushPanel: (panel: MobileNavPanel<TCategory>) => void
}

export type MobileNavPanelsController<TCategory> = {
  actions: MobileNavPanelsActions<TCategory>
  state: MobileNavPanelsState<TCategory>
}
