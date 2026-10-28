import { ChevronDown } from 'lucide-react'

import {
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRoot,
  MenuTrigger,
} from '@/components/ui/menu'
import { cn } from '@/components/ui/utils'

import { getFilterButtonClassName } from './product-listing-filter-ui-view'

export type ProductListingSortOption = {
  label: string
  value: string
}

export function ProductListingSortMenuView({
  ariaLabel,
  className,
  label,
  onValueChange,
  options,
  value,
}: {
  ariaLabel: string
  className?: string
  label: string
  onValueChange: (value: string) => void
  options: ProductListingSortOption[]
  value: string
}) {
  return (
    <MenuRoot>
      <MenuTrigger
        aria-label={ariaLabel}
        className={cn(
          getFilterButtonClassName(false),
          'group shrink-0',
          className,
        )}
        type="button"
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
        />
      </MenuTrigger>

      <MenuContent>
        <MenuRadioGroup
          aria-label={ariaLabel}
          onValueChange={onValueChange}
          value={value}
        >
          {options.map((option) => (
            <MenuRadioItem
              indicatorPosition="end"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </MenuRoot>
  )
}
