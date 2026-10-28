import { cn } from '@/components/ui/utils'

import type { CartQuantitySelectorModel } from '@/components/contracts/cart'
import { useCartQuantitySelectorController } from './use-cart-quantity-selector-controller'

export type { CartQuantitySelectorModel } from '@/components/contracts/cart'

type CartQuantitySelectorViewProps = {
  model: CartQuantitySelectorModel
  onUpdateQuantity: (quantity: number) => Promise<void>
}

export function CartQuantitySelectorView({
  model,
  onUpdateQuantity,
}: CartQuantitySelectorViewProps) {
  const {
    decreaseLabel,
    disabled,
    increaseLabel,
    maxQuantity,
    quantity,
    quantityLabel,
    size,
  } = model
  const isDrawer = size === 'drawer'
  const {
    draftQuantity,
    getQuantityForStep,
    handleInputBlur,
    handleInputChange,
    handleInputFocus,
    handleInputKeyDown,
    handleStepDown,
    handleStepPointerDown,
    handleStepUp,
  } = useCartQuantitySelectorController({
    maxQuantity,
    onUpdateQuantity,
    quantity,
  })
  const stepButtonClassName = cn(
    'flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
    isDrawer
      ? 'h-7 w-7 text-base sm:h-9 sm:w-9 sm:text-xl max-lg:landscape:h-7 max-lg:landscape:w-7 max-lg:landscape:text-base'
      : 'h-10 w-10 text-base',
  )

  return (
    <div
      data-disabled={disabled}
      className="inline-flex items-center border border-input bg-background text-foreground transition-colors motion-reduce:transition-none data-[disabled=false]:hover:not-focus-within:border-foreground/40 data-[disabled=false]:focus-within:border-foreground"
    >
      <button
        aria-label={decreaseLabel}
        className={stepButtonClassName}
        disabled={disabled || getQuantityForStep() <= 1}
        onClick={handleStepDown}
        onPointerDown={handleStepPointerDown}
        type="button"
      >
        -
      </button>
      <input
        aria-label={quantityLabel}
        className={cn(
          'border-x border-input bg-background px-0 text-center text-base text-foreground outline-none transition-colors motion-reduce:transition-none enabled:hover:not-focus:border-foreground/40 focus:border-foreground focus:bg-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
          isDrawer
            ? 'h-7 w-9 sm:h-9 sm:w-12 max-lg:landscape:h-7 max-lg:landscape:w-9'
            : 'h-10 w-12',
        )}
        disabled={disabled}
        inputMode="numeric"
        onBlur={handleInputBlur}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        pattern="[0-9]*"
        type="text"
        value={draftQuantity}
      />
      <button
        aria-label={increaseLabel}
        className={stepButtonClassName}
        disabled={disabled || getQuantityForStep() >= maxQuantity}
        onClick={handleStepUp}
        onPointerDown={handleStepPointerDown}
        type="button"
      >
        +
      </button>
    </div>
  )
}
