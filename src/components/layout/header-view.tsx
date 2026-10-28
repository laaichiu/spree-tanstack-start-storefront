import type { HeaderProps } from '../contracts/layout'

export type { HeaderProps, HeaderSlots } from '../contracts/layout'

export function HeaderView({ slots }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background">
      {slots.announcement}
      <div className="border-b border-border bg-background">
        <div className="relative flex h-16 w-full items-center gap-6 px-4 xl:grid xl:h-12 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-8">
          {slots.desktopNavigation}
          {slots.mobileNavigation}
          {slots.brand}
          <div className="ml-auto flex items-center justify-end xl:ml-0 xl:justify-self-end">
            {slots.actions}
          </div>
        </div>
      </div>
    </header>
  )
}
