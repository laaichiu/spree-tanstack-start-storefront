import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'

import { DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type MobileNavDrawerRootProps = {
  children: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function MobileNavDrawerRoot({
  children,
  onOpenChange,
  open,
}: MobileNavDrawerRootProps) {
  return (
    <BaseDialog.Root
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      open={open}
    >
      {children}
    </BaseDialog.Root>
  )
}

export function MobileNavDrawerTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Trigger>) {
  return (
    <BaseDialog.Trigger
      className={cn('focus-visible:focus-ring', className)}
      {...props}
    />
  )
}

export function MobileNavDrawerContent({
  children,
  className,
  closeLabel = 'Close drawer',
  hideHeader = false,
  title,
}: {
  children: ReactNode
  className?: string
  closeLabel?: string
  hideHeader?: boolean
  title: string
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="top-storefront-mobile-header fixed inset-x-0 bottom-0 z-40 bg-black/30 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
      <BaseDialog.Popup
        className={cn(
          'top-storefront-mobile-header fixed bottom-0 left-0 z-50 flex w-[min(26.5rem,calc(100vw-2.25rem))] flex-col border-t border-r border-border bg-popover text-popover-foreground outline-none transition-transform duration-300 ease-out data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full lg:hidden',
          className,
        )}
      >
        {hideHeader ? (
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
        ) : (
          <div className="flex min-h-14 items-center justify-between border-b border-border px-6">
            <BaseDialog.Title className="text-sm leading-4 font-normal uppercase text-foreground">
              {title}
            </BaseDialog.Title>
            <DialogClose
              aria-label={closeLabel}
              className="-mr-2 inline-flex h-9 w-9 items-center justify-center"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </DialogClose>
          </div>
        )}
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}
