import { cn } from '@/components/ui/utils'

import type { ProductOptionSelectorModel } from './product-option-selector-model'

type ProductOptionSelectorProps = {
  model: ProductOptionSelectorModel
  onSelectOption: (optionId: string, valueId: string) => void
}

export function ProductOptionSelectorView({
  model,
  onSelectOption,
}: ProductOptionSelectorProps) {
  if (model.options.length === 0) {
    return null
  }

  return (
    <div className="mt-7 space-y-7 lg:mt-12">
      {model.options.map((option) => (
        <fieldset key={option.id} className="space-y-3.5">
          <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs font-semibold tracking-wider text-foreground uppercase">
              {option.label}
            </span>
            <span className="text-xs tracking-wider text-foreground uppercase">
              {option.selectedLabel}
            </span>
          </legend>
          <div
            className={
              option.isColor
                ? 'flex flex-wrap gap-2.5'
                : 'grid grid-cols-4 gap-2 sm:grid-cols-5'
            }
          >
            {option.values.map((value) => {
              return (
                <button
                  aria-label={value.label}
                  aria-pressed={value.isSelected}
                  className={cn(
                    'relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35',
                    option.isColor
                      ? 'inline-flex h-7 w-7 items-center justify-center rounded-full'
                      : 'flex h-12 items-center justify-center border px-3 text-xs tracking-wider uppercase',
                    option.isColor && value.isSelected
                      ? 'ring-1 ring-foreground'
                      : null,
                    !option.isColor && value.isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : null,
                    !option.isColor && !value.isSelected
                      ? 'border-input bg-background text-foreground hover:border-foreground'
                      : null,
                    option.isColor && !value.isSelected
                      ? 'hover:ring-1 hover:ring-foreground/30'
                      : null,
                  )}
                  disabled={!value.isSelectable}
                  key={value.id}
                  onClick={() => onSelectOption(option.id, value.id)}
                  type="button"
                >
                  {option.isColor ? (
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 rounded-full border border-input bg-muted"
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
                  {!value.isSelectable ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute bg-current opacity-65',
                        option.isColor
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
