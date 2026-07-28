import * as React from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const MenuRoot = BaseMenu.Root

function MenuTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseMenu.Trigger>) {
  return (
    <BaseMenu.Trigger className={cn('outline-none', className)} {...props} />
  )
}

type MenuContentProps = React.ComponentPropsWithoutRef<
  typeof BaseMenu.Popup
> & {
  align?: React.ComponentPropsWithoutRef<typeof BaseMenu.Positioner>['align']
  sideOffset?: React.ComponentPropsWithoutRef<
    typeof BaseMenu.Positioner
  >['sideOffset']
}

const MenuContent = React.forwardRef<
  React.ComponentRef<typeof BaseMenu.Popup>,
  MenuContentProps
>(function MenuContentImpl(
  { align = 'end', children, className, sideOffset = 8, ...props },
  ref,
) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        align={align}
        className="z-[70] outline-none"
        sideOffset={sideOffset}
      >
        <BaseMenu.Popup
          className={cn(
            'max-h-[min(24rem,var(--available-height))] min-w-56 origin-[var(--transform-origin)] overflow-y-auto border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none',
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
})
MenuContent.displayName = 'MenuContent'

const MenuRadioGroup = BaseMenu.RadioGroup

const MenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof BaseMenu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof BaseMenu.RadioItem>
>(function MenuRadioItemImpl(
  { children, className, closeOnClick = true, ...props },
  ref,
) {
  return (
    <BaseMenu.RadioItem
      className={cn(
        'grid cursor-default grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground outline-none select-none data-[checked]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground',
        className,
      )}
      closeOnClick={closeOnClick}
      ref={ref}
      {...props}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        <BaseMenu.RadioItemIndicator>
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        </BaseMenu.RadioItemIndicator>
      </span>
      <span className="min-w-0">{children}</span>
    </BaseMenu.RadioItem>
  )
})
MenuRadioItem.displayName = 'MenuRadioItem'

export { MenuContent, MenuRadioGroup, MenuRadioItem, MenuRoot, MenuTrigger }
