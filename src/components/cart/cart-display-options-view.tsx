import type { CartDisplayOptionsModel } from '@/components/contracts/cart'

export type { CartDisplayOption } from '@/components/contracts/cart'
export type { CartDisplayOptionsModel } from '@/components/contracts/cart'

type CartDisplayOptionsViewProps = {
  className: string
  model: CartDisplayOptionsModel
  optionClassName: string
}

export function CartDisplayOptionsView({
  className,
  model,
  optionClassName,
}: CartDisplayOptionsViewProps) {
  if (model.options.length === 0) {
    return null
  }

  return (
    <p className={className}>
      {model.options.map((option, index) => (
        <span className={optionClassName} key={option.id}>
          {index > 0 && <span aria-hidden="true">|</span>}
          {option.isColor && (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-input bg-muted"
              style={
                option.colorCode
                  ? { backgroundColor: option.colorCode }
                  : undefined
              }
            />
          )}
          <span>{option.label}</span>
        </span>
      ))}
    </p>
  )
}
