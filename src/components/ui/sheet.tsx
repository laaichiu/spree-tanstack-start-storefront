import * as React from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { X } from 'lucide-react'
import { RemoveScroll } from 'react-remove-scroll'

import { cn } from '@/lib/utils'

type SheetSide = 'top' | 'bottom' | 'left' | 'right'

type SheetProps = Drawer.Root.Props
type SheetHandle = ReturnType<typeof Drawer.createHandle>

const createSheetHandle = Drawer.createHandle

function Sheet({ modal = 'trap-focus', ...props }: SheetProps) {
  return <Drawer.Root modal={modal} {...props} />
}

const SheetTrigger = Drawer.Trigger

const SheetClose = Drawer.Close

const SheetPortal = Drawer.Portal

const sheetVariants: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 max-h-[85dvh] data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full',
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
  left: 'inset-y-0 left-0 h-full w-full max-w-lg data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full',
  right:
    'inset-y-0 right-0 h-full w-full max-w-lg data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full',
}

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof Drawer.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Drawer.Backdrop>
>(function SheetOverlayImpl({ className, ...props }, ref) {
  return (
    <Drawer.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/45 transition-opacity duration-200 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
SheetOverlay.displayName = 'SheetOverlay'

interface SheetContentProps extends React.ComponentPropsWithoutRef<
  typeof Drawer.Popup
> {
  side?: SheetSide
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof Drawer.Popup>,
  SheetContentProps
>(function SheetContentImpl(
  { side = 'right', className, children, ...props },
  ref,
) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Viewport className="fixed inset-0 z-[60] flex items-stretch justify-end">
        <RemoveScroll as="div" className="contents" enabled removeScrollBar>
          <Drawer.Popup
            className={cn(
              'fixed z-[60] flex transform-gpu flex-col bg-popover text-popover-foreground shadow-xl outline-none transition-transform duration-300 ease-out data-[ending-style]:duration-200 data-[ending-style]:ease-in motion-reduce:duration-0',
              sheetVariants[side],
              className,
            )}
            ref={ref}
            {...props}
          >
            <Drawer.Content className="contents">{children}</Drawer.Content>
          </Drawer.Popup>
        </RemoveScroll>
      </Drawer.Viewport>
    </SheetPortal>
  )
})
SheetContent.displayName = 'SheetContent'

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-4', className)}
      {...props}
    />
  )
}
SheetHeader.displayName = 'SheetHeader'

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shrink-0', className)} {...props} />
}
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(function SheetTitleImpl({ className, ...props }, ref) {
  return (
    <Drawer.Title
      className={cn(
        'text-xl leading-none font-normal text-foreground',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(function SheetDescriptionImpl({ className, ...props }, ref) {
  return (
    <Drawer.Description
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      ref={ref}
      {...props}
    />
  )
})
SheetDescription.displayName = 'SheetDescription'

const SheetCloseButton = React.forwardRef<
  React.ComponentRef<typeof Drawer.Close>,
  React.ComponentPropsWithoutRef<typeof Drawer.Close>
>(function SheetCloseButtonImpl({ children, className, ...props }, ref) {
  const closeLabel =
    typeof props['aria-label'] === 'string' ? props['aria-label'] : 'Close'

  return (
    <Drawer.Close
      className={cn(
        'cursor-pointer bg-transparent text-foreground transition-colors hover:bg-transparent hover:text-muted-foreground focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    >
      {children ?? (
        <>
          <X aria-hidden="true" className="h-6 w-6 stroke-[1.35]" />
          <span className="sr-only">{closeLabel}</span>
        </>
      )}
    </Drawer.Close>
  )
})
SheetCloseButton.displayName = 'SheetCloseButton'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetCloseButton,
  createSheetHandle,
}

export type { SheetHandle }
