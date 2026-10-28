import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function AccountPasswordToggleView({
  ariaLabel,
  disabled,
  isVisible,
  onToggle,
}: {
  ariaLabel: string
  disabled: boolean
  isVisible: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="icon"
      aria-label={ariaLabel}
      className="text-muted-foreground hover:text-foreground"
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      {isVisible ? (
        <EyeOff aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Eye aria-hidden="true" className="h-4 w-4" />
      )}
    </Button>
  )
}
