import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

export function DialogRoot({
  children,
  disablePointerDismissal,
  modal,
  onOpenChange,
  open,
}: {
  children: ReactNode
  disablePointerDismissal?: ComponentPropsWithoutRef<
    typeof BaseDialog.Root
  >['disablePointerDismissal']
  modal?: ComponentPropsWithoutRef<typeof BaseDialog.Root>['modal']
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <BaseDialog.Root
      disablePointerDismissal={disablePointerDismissal}
      modal={modal}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      open={open}
    >
      {children}
    </BaseDialog.Root>
  )
}

export function DialogTrigger({
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

export function DialogClose({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Close>) {
  return (
    <BaseDialog.Close
      className={cn(
        'cursor-pointer bg-transparent text-foreground transition-colors hover:bg-transparent hover:text-muted-foreground focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function DialogContent({
  backdropClassName,
  children,
  className,
  closeLabel = 'Close dialog',
  description,
  forceBackdrop = false,
  onKeyDown,
  showHeader = true,
  title,
}: {
  backdropClassName?: string
  children: ReactNode
  className?: string
  closeLabel?: string
  description?: string
  forceBackdrop?: boolean
  onKeyDown?: ComponentPropsWithoutRef<typeof BaseDialog.Popup>['onKeyDown']
  showHeader?: boolean
  title: string
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(
          'fixed inset-0 z-40 bg-black/35 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
          backdropClassName,
        )}
        forceRender={forceBackdrop}
      />
      <BaseDialog.Popup
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-popover p-6 text-popover-foreground shadow-xl outline-none transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:p-8',
          className,
        )}
        onKeyDown={onKeyDown}
      >
        {showHeader ? (
          <div className="flex items-start justify-between gap-6">
            <div>
              <BaseDialog.Title className="text-xl leading-tight text-foreground">
                {title}
              </BaseDialog.Title>
              {description ? (
                <BaseDialog.Description className="text-sm leading-6 mt-3 text-muted-foreground">
                  {description}
                </BaseDialog.Description>
              ) : null}
            </div>
            <DialogClose
              aria-label={closeLabel}
              className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </DialogClose>
          </div>
        ) : (
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
        )}

        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}
