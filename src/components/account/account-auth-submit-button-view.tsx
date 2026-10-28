import { Button } from '@/components/ui/button'

export function AccountAuthSubmitButtonView({
  disabled,
  label,
}: {
  disabled: boolean
  label: string
}) {
  return (
    <Button className="h-12 w-full" disabled={disabled} size="lg" type="submit">
      {label}
    </Button>
  )
}
