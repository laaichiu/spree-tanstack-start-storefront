import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/components/ui/utils'
import { Button } from '@/components/ui/button'
import type { MobileNavMainPanelSlots } from '../contracts/layout'

export type { MobileNavMainPanelSlots } from '../contracts/layout'

export type MobileNavNestedPanel = {
  content: ReactNode
  id: string
  stackIndex: number
}

export function MobileNavPanelsView({
  animatedIndex,
  isPopping,
  isNestedPanel,
  mainPanel,
  nestedPanels,
}: {
  animatedIndex: number
  isPopping: boolean
  isNestedPanel: boolean
  mainPanel: ReactNode
  nestedPanels: MobileNavNestedPanel[]
}) {
  const lastStackIndex = nestedPanels.at(-1)?.stackIndex ?? 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-popover">
      <div className="relative flex-1 overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 flex flex-col bg-popover transition-transform duration-300 ease-out motion-reduce:transition-none',
            (animatedIndex === 0 && !isNestedPanel) ||
              (isPopping && animatedIndex === 0)
              ? 'translate-x-0'
              : '-translate-x-full',
          )}
        >
          {mainPanel}
        </div>

        {nestedPanels.map((panel) => {
          const isAnimatedIn = panel.stackIndex <= animatedIndex
          let translateClass = 'translate-x-full'

          if (isAnimatedIn && panel.stackIndex < lastStackIndex) {
            translateClass = '-translate-x-full'
          } else if (isAnimatedIn) {
            translateClass = 'translate-x-0'
          }

          if (isPopping && panel.stackIndex === animatedIndex) {
            translateClass = 'translate-x-0'
          } else if (isPopping && panel.stackIndex === lastStackIndex) {
            translateClass = 'translate-x-full'
          }

          return (
            <div
              className={cn(
                'absolute inset-0 flex flex-col bg-popover transition-transform duration-300 ease-out motion-reduce:transition-none',
                translateClass,
              )}
              key={panel.id}
            >
              {panel.content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MobileNavMainPanelView({
  categoriesLabel,
  slots,
}: {
  categoriesLabel: string
  slots: MobileNavMainPanelSlots
}) {
  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto px-8 pt-5 pb-8">
        <nav aria-label={categoriesLabel} className="space-y-0.5">
          {slots.brandLink}
          {slots.categoryLinks}
        </nav>

        <div className="mt-8 space-y-0.5 pt-2">{slots.accountLink}</div>
      </div>
      <div className="min-h-14">{slots.marketSelector}</div>
    </>
  )
}

export function MobileNavCategoryPanelView({
  backLabel,
  categoryLinks,
  featuredLink,
  onBack,
  title,
}: {
  backLabel: string
  categoryLinks: ReactNode
  featuredLink?: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <>
      <div className="relative flex min-h-16 items-center justify-center border-b border-border px-6 py-4">
        <Button
          variant="icon"
          aria-label={backLabel}
          className="absolute left-6"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <p className="text-xs font-normal text-foreground">{title}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pt-8 pb-10">
        <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
          {title}
        </h2>

        <nav aria-label={title} className="mt-4 space-y-0.5">
          {categoryLinks}
        </nav>
        {featuredLink && <div className="mt-8">{featuredLink}</div>}
      </div>
    </>
  )
}
