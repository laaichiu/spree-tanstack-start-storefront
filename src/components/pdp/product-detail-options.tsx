import type { Product } from '@/lib/catalog/model/product'
import type { SelectedProductOptions } from '@/lib/catalog/utils/variant-selection'
import { isOptionValueSelectable } from '@/lib/catalog/utils/variant-selection'
import {
  getOptionSwatchClass,
  isColorOption,
} from '@/lib/catalog/option-swatch'
import { cn } from '@/lib/utils'

type ProductDetailOptionsProps = {
  onSelectOption: (optionId: string, valueId: string) => void
  product: Product
  selectedOptions: SelectedProductOptions
}

export function ProductDetailOptions({
  onSelectOption,
  product,
  selectedOptions,
}: ProductDetailOptionsProps) {
  if (product.options.length === 0) {
    return null
  }

  return (
    <div className="mt-12 space-y-7">
      {product.options.map((option) => (
        <fieldset key={option.id} className="space-y-3.5">
          <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm font-semibold tracking-wider text-foreground uppercase">
              {option.label}
            </span>
            <span className="text-sm tracking-wider text-foreground uppercase">
              {
                option.values.find(
                  (value) => value.id === selectedOptions[option.id],
                )?.label
              }
            </span>
          </legend>
          <div
            className={
              isColorOption(option.label)
                ? 'flex flex-wrap gap-2.5'
                : 'grid grid-cols-4 gap-2 sm:grid-cols-5'
            }
          >
            {option.values.map((value) => {
              const selectedValueId = selectedOptions[option.id]
              const isSelected = selectedValueId === value.id
              const selectable = isOptionValueSelectable({
                optionId: option.id,
                product,
                selectedOptions,
                valueId: value.id,
              })
              const isColor = isColorOption(option.label)

              return (
                <button
                  aria-label={value.label}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-35',
                    isColor
                      ? 'inline-flex h-9 w-9 items-center justify-center rounded-full'
                      : 'flex h-12 items-center justify-center border px-3 text-sm tracking-wider uppercase',
                    isColor && isSelected ? 'ring-1 ring-foreground' : null,
                    !isColor && isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : null,
                    !isColor && !isSelected
                      ? 'border-input bg-background text-foreground hover:border-foreground'
                      : null,
                    isColor && !isSelected
                      ? 'hover:ring-1 hover:ring-foreground/30'
                      : null,
                  )}
                  disabled={!selectable}
                  key={value.id}
                  onClick={() => onSelectOption(option.id, value.id)}
                  type="button"
                >
                  {isColor ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-6 w-6 rounded-full border border-input',
                        value.colorCode || value.imageUrl
                          ? null
                          : getOptionSwatchClass(value.label),
                      )}
                      style={
                        value.imageUrl
                          ? {
                              backgroundImage: `url(${value.imageUrl})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : value.colorCode
                            ? { backgroundColor: value.colorCode }
                            : undefined
                      }
                    />
                  ) : (
                    <span>{value.label}</span>
                  )}
                  {!selectable ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute bg-current opacity-65',
                        isColor
                          ? 'h-px w-12 rotate-45'
                          : 'inset-x-2 top-1/2 h-px -translate-y-1/2',
                      )}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
