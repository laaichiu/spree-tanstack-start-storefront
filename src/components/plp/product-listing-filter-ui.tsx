import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function getFilterButtonClassName(
  isActive = false,
  sizeClassName = 'h-9 px-3',
) {
  return cn(
    'inline-flex items-center gap-2 border text-sm font-normal tracking-wider uppercase transition-colors focus-visible:focus-ring',
    sizeClassName,
    isActive
      ? 'border-foreground bg-foreground text-background'
      : 'border-input bg-background text-foreground hover:border-foreground',
  )
}

export function FilterToolbarButton({
  badgeCount,
  isActive,
  label,
  onClick,
}: {
  badgeCount?: number
  isActive?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <SheetTrigger
      className={getFilterButtonClassName(isActive)}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      {badgeCount ? <span className="text-sm">({badgeCount})</span> : null}
    </SheetTrigger>
  )
}

export function FilterAccordionItem({
  activeCount,
  children,
  isOpen,
  label,
  onToggle,
}: {
  activeCount?: number
  children: ReactNode
  isOpen: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <section className="border-b border-border">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:focus-ring"
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wider text-foreground uppercase">
            {label}
          </span>
          {activeCount ? (
            <span className="text-sm tracking-wider text-muted-foreground uppercase">
              {activeCount}
            </span>
          ) : null}
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen ? 'rotate-180' : null,
          )}
        />
      </button>
      {isOpen ? <div className="pb-5">{children}</div> : null}
    </section>
  )
}

export function CheckboxIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center border transition-colors',
        selected
          ? 'border-foreground bg-foreground text-background'
          : 'border-input bg-background text-transparent',
      )}
    >
      <Check className="h-3 w-3" />
    </span>
  )
}

export function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
        selected ? 'border-foreground' : 'border-input',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full transition-colors',
          selected ? 'bg-foreground' : 'bg-transparent',
        )}
      />
    </span>
  )
}
