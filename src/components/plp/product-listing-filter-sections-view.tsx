import type { ProductListingFilterDisplay } from './product-listing-option-filter-display'
import { ProductListingFilterOptionsView } from './product-listing-filter-options-view'
import { ProductListingFilterChoiceListView } from './product-listing-filter-choice-list-view'
import { FilterAccordionItemView } from './product-listing-filter-ui-view'
import type { ProductListingFilterChoiceDisplay } from './product-listing-filter-types'

export function ProductListingOptionFilterSectionView({
  activeCount,
  filter,
  isOpen,
  label,
  onToggle,
  onToggleOption,
  selectedOptionIds,
}: {
  activeCount?: number
  filter: ProductListingFilterDisplay
  isOpen: boolean
  label: string
  onToggle: () => void
  onToggleOption: (optionId: string) => void
  selectedOptionIds: readonly string[]
}) {
  return (
    <FilterAccordionItemView
      activeCount={activeCount}
      isOpen={isOpen}
      label={label}
      onToggle={onToggle}
    >
      <ProductListingFilterOptionsView
        filter={filter}
        onToggle={onToggleOption}
        selectedOptionIds={selectedOptionIds}
      />
    </FilterAccordionItemView>
  )
}

export function ProductListingChoiceFilterSectionView({
  activeCount,
  choices,
  isOpen,
  label,
  onSelect,
  onToggle,
}: {
  activeCount?: number
  choices: ProductListingFilterChoiceDisplay[]
  isOpen: boolean
  label: string
  onSelect: (choiceId: string) => void
  onToggle: () => void
}) {
  return (
    <FilterAccordionItemView
      activeCount={activeCount}
      isOpen={isOpen}
      label={label}
      onToggle={onToggle}
    >
      <ProductListingFilterChoiceListView
        choices={choices}
        onSelect={onSelect}
      />
    </FilterAccordionItemView>
  )
}
