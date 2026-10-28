import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'

import { MobileNavDrawerTriggerView } from './mobile-nav-drawer-view'

export function MobileNavTriggerView({
  ariaLabel,
  hasInteracted,
  onClick,
  open,
}: {
  ariaLabel: string
  hasInteracted: boolean
  onClick: () => void
  open: boolean
}) {
  return (
    <MobileNavDrawerTriggerView
      aria-expanded={open}
      aria-label={ariaLabel}
      className={buttonClassName({
        variant: 'icon',
        className: 'z-[60] xl:hidden',
      })}
      onClick={onClick}
      type="button"
    >
      <span className="relative block h-5 w-5">
        <span
          className={cn(
            'absolute top-0.5 right-0 left-0 h-0.5 rounded-full bg-current transition-transform duration-300 ease-in-out motion-reduce:transition-none',
            hasInteracted && open && 'translate-y-[7px] rotate-45',
          )}
        />
        <span
          className={cn(
            'absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 rounded-full bg-current transition-opacity duration-150 ease-in-out motion-reduce:transition-none',
            hasInteracted && open ? 'opacity-0' : 'opacity-100',
          )}
        />
        <span
          className={cn(
            'absolute right-0 bottom-0.5 left-0 h-0.5 rounded-full bg-current transition-transform duration-300 ease-in-out motion-reduce:transition-none',
            hasInteracted && open && '-translate-y-[7px] -rotate-45',
          )}
        />
      </span>
    </MobileNavDrawerTriggerView>
  )
}
