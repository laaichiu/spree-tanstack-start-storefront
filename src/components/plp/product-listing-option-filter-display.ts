import type { ProductListingOptionFilter } from '@/lib/catalog/contracts'

export type ProductListingFilterOptionDisplay = {
  colorCode: string | null
  count: number
  id: string
  imageUrl: string | null
  label: string
}

export type ProductListingFilterDisplay = {
  kind: string
  options: ProductListingFilterOptionDisplay[]
}

export function getProductListingFilterDisplay(
  filter: ProductListingOptionFilter,
): ProductListingFilterDisplay {
  return {
    kind: filter.kind,
    options: filter.options.map((option) => ({
      colorCode: option.colorCode,
      count: option.count,
      id: option.id,
      imageUrl: option.imageUrl,
      label: getProductListingOptionLabel(option),
    })),
  }
}

type ProductListingActiveOptionDisplay = {
  filterLabel: string | null
  label: string
  optionId: string
}

export function getProductListingActiveOptionDisplays(
  optionFilters: readonly ProductListingOptionFilter[],
  selectedOptionIds: readonly string[],
): ProductListingActiveOptionDisplay[] {
  const optionMetaById = new Map(
    optionFilters.flatMap((optionFilter) =>
      optionFilter.options.map(
        (option) =>
          [
            option.id,
            {
              filterLabel: optionFilter.label,
              label: getProductListingOptionLabel(option),
            },
          ] as const,
      ),
    ),
  )

  return selectedOptionIds.map((optionId) => {
    const meta = optionMetaById.get(optionId)

    return {
      filterLabel: meta?.filterLabel ?? null,
      label: meta?.label ?? optionId,
      optionId,
    }
  })
}

function getProductListingOptionLabel(option: {
  id: string
  label: string
  name: string
}) {
  return option.label || option.name || option.id
}
