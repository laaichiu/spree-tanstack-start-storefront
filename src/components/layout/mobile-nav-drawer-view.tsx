import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { DialogClose } from '@/components/ui/dialog'
import { CloseIcon } from '@/components/ui/close-icon'
import { cn } from '@/components/ui/utils'

export function MobileNavDrawerRootView({
  children,
  onOpenChange,
  open,
}: {
  children: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <BaseDialog.Root
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      open={open}
    >
      {children}
    </BaseDialog.Root>
  )
}

export function MobileNavDrawerTriggerView({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Trigger>) {
  return (
    <BaseDialog.Trigger
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

export function MobileNavDrawerContentView({
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
      <BaseDialog.Backdrop className="fixed inset-x-0 top-26 bottom-0 z-40 bg-black/30 transition-opacity motion-reduce:transition-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 xl:hidden" />
      <BaseDialog.Popup
        className={cn(
          'fixed top-26 bottom-0 left-0 z-50 flex w-[min(26.5rem,calc(100vw-2.25rem))] flex-col border-t border-r border-border bg-popover text-popover-foreground outline-none transition-transform duration-300 ease-out motion-reduce:transition-none data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full xl:hidden',
          className,
        )}
      >
        {hideHeader ? (
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
        ) : (
          <div className="flex min-h-14 items-center justify-between border-b border-border px-6">
            <BaseDialog.Title className="text-xs leading-4 font-normal uppercase text-foreground">
              {title}
            </BaseDialog.Title>
            <DialogClose aria-label={closeLabel}>
              <CloseIcon />
            </DialogClose>
          </div>
        )}
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}
