import { buttonClassName } from '@/components/ui/button'

export function CheckoutSubmitButtonView({
  disabled,
  label,
  onSubmit,
}: {
  disabled: boolean
  label: string
  onSubmit: () => void
}) {
  return (
    <button
      className={buttonClassName({
        className: 'h-14 w-full bg-foreground text-background',
        size: 'lg',
      })}
      disabled={disabled}
      onClick={onSubmit}
      type="button"
    >
      {label}
    </button>
  )
}
