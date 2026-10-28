import { RadioIndicatorView } from './product-listing-filter-ui-view'
import type { ProductListingFilterChoiceDisplay } from './product-listing-filter-types'

export function ProductListingFilterChoiceListView({
  choices,
  onSelect,
}: {
  choices: ProductListingFilterChoiceDisplay[]
  onSelect: (choiceId: string) => void
}) {
  return (
    <div className="space-y-2">
      {choices.map((choice) => (
        <button
          className="flex w-full items-center gap-3 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          type="button"
        >
          <RadioIndicatorView selected={choice.selected} />
          <span className="flex-1">{choice.label}</span>
          {choice.count !== undefined ? (
            <span className="text-xs text-muted-foreground">
              {choice.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
