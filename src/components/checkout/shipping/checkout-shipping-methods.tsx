import { ProductPrice } from '@/components/shared/product-price'
import { RadioGroup, RadioOption } from '@/components/ui/radio'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import { cn } from '@/lib/utils'

export function CheckoutShippingMethods({
  disabled,
  isUpdating = false,
  onSelect,
  placeholder,
  rates,
  selectedRateId,
}: {
  disabled: boolean
  isUpdating?: boolean
  onSelect: (rate: CartShippingRate) => void
  placeholder: string
  rates: CartShippingRate[]
  selectedRateId: string
}) {
  if (
    shouldShowCheckoutShippingMethodsPlaceholder({
      hasRates: rates.length > 0,
      isUpdating,
    })
  ) {
    return (
      <div className="border border-border px-5 py-5">
        <p className="text-sm leading-6 text-muted-foreground">{placeholder}</p>
      </div>
    )
  }

  return (
    <RadioGroup
      className="overflow-hidden border border-border"
      data-testid="checkout-shipping-methods"
      disabled={disabled}
      onValueChange={(rateId) => {
        const nextRate = rates.find((rate) => rate.id === rateId)

        if (nextRate) {
          onSelect(nextRate)
        }
      }}
      value={selectedRateId}
    >
      {rates.map((rate, index) => (
        <RadioOption
          className={cn(
            'px-5 py-4',
            index > 0 ? 'border-t border-border' : null,
            rate.selected ? 'bg-muted' : 'bg-background hover:bg-muted',
          )}
          key={`${rate.fulfillmentId}:${rate.id}`}
          label={rate.name}
          onClick={() => {
            if (!disabled && rate.id === selectedRateId) {
              onSelect(rate)
            }
          }}
          trailing={
            <ProductPrice price={rate.displayPrice} variant="listing" />
          }
          value={rate.id}
        />
      ))}
    </RadioGroup>
  )
}

export function shouldShowCheckoutShippingMethodsPlaceholder({
  hasRates,
  isUpdating,
}: {
  hasRates: boolean
  isUpdating: boolean
}) {
  return isUpdating || !hasRates
}
