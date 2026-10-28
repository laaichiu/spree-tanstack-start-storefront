import { isColorOption, isOptionValueSelectable } from '@/lib/catalog/contracts'
import type {
  Product,
  ProductOptionValue,
  SelectedProductOptions,
} from '@/lib/catalog/contracts'

export type ProductOptionSelectionValue = Pick<
  ProductOptionValue,
  'colorCode' | 'id' | 'imageUrl' | 'label'
> & {
  isSelectable: boolean
  isSelected: boolean
}

export type ProductOptionSelection = {
  id: string
  isColor: boolean
  label: string
  selectedLabel: string | null
  values: ProductOptionSelectionValue[]
}

export type ProductOptionSelectorModel = {
  options: readonly ProductOptionSelection[]
}

export function getProductOptionSelectorModel(
  product: Product,
  selectedOptions: SelectedProductOptions,
): ProductOptionSelectorModel {
  return {
    options: product.options.map((option) => ({
      id: option.id,
      isColor: isColorOption(option.label),
      label: option.label,
      selectedLabel:
        option.values.find((value) => value.id === selectedOptions[option.id])
          ?.label ?? null,
      values: option.values.map((value) => ({
        colorCode: value.colorCode,
        id: value.id,
        imageUrl: value.imageUrl,
        isSelectable: isOptionValueSelectable({
          optionId: option.id,
          product,
          selectedOptions,
          valueId: value.id,
        }),
        isSelected: selectedOptions[option.id] === value.id,
        label: value.label,
      })),
    })),
  }
}
