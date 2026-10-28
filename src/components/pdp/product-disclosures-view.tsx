import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/components/ui/utils'

import type {
  ProductDisclosureSection,
  ProductDisclosuresModel,
} from '../contracts/catalog'

export type {
  ProductDisclosureSection,
  ProductDisclosuresCopy,
  ProductDisclosuresModel,
} from '../contracts/catalog'

type ProductDisclosuresProps = {
  expandedSection: ProductDisclosureSection | null
  model: ProductDisclosuresModel
  onToggle: (section: ProductDisclosureSection) => void
}

export function ProductDisclosuresView({
  expandedSection,
  model,
  onToggle,
}: ProductDisclosuresProps) {
  const { copy } = model
  return (
    <section className="border-b border-border">
      <DisclosurePanel
        expanded={expandedSection === 'description'}
        id="product-detail-description"
        label={copy.description}
        onToggle={() => onToggle('description')}
      >
        <div className="space-y-5">
          <ProductDescriptionView
            description={model.description}
            descriptionHtml={model.descriptionHtml}
            unavailableMessage={copy.productUnavailableDescription}
          />
          {model.activeSku && (
            <p className="pt-4 text-xs tracking-wider text-muted-foreground">
              {copy.itemNumberLabel.replace('{sku}', model.activeSku)}
            </p>
          )}
        </div>
      </DisclosurePanel>

      <DisclosurePanel
        expanded={expandedSection === 'details'}
        id="product-detail-details"
        label={copy.details}
        onToggle={() => onToggle('details')}
      >
        {model.specifications.length > 0 ? (
          <dl>
            {model.specifications.map((specification) => (
              <div
                className="grid grid-cols-2 items-start gap-x-6 py-3"
                key={`${specification.label}-${specification.value}`}
              >
                <dt className="text-xs leading-6 text-muted-foreground">
                  {specification.label}
                </dt>
                <dd className="min-w-0 text-right text-xs leading-6 text-foreground">
                  {specification.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs leading-6 text-muted-foreground">
            {copy.noAdditionalProperties}
          </p>
        )}
      </DisclosurePanel>
    </section>
  )
}

function DisclosurePanel({
  children,
  expanded,
  id,
  label,
  onToggle,
}: {
  children: ReactNode
  expanded: boolean
  id: string
  label: string
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        aria-controls={id}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={onToggle}
        type="button"
      >
        <span className="text-xs leading-none font-semibold tracking-wider text-foreground uppercase">
          {label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded ? (
        <div className="pb-7" id={id}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

function ProductDescriptionView({
  description,
  descriptionHtml,
  unavailableMessage,
}: {
  description: string
  descriptionHtml: string
  unavailableMessage: string
}) {
  if (descriptionHtml) {
    // The catalog mapper sanitizes Spree rich text before it reaches this view.
    return (
      <div
        className="prose prose-neutral text-xs leading-5 max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-foreground prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
    )
  }

  if (description) {
    return (
      <p className="whitespace-pre-line text-xs leading-6 text-muted-foreground">
        {description}
      </p>
    )
  }

  return (
    <p className="text-xs leading-6 text-muted-foreground">
      {unavailableMessage}
    </p>
  )
}
