import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Product } from '@/lib/catalog/model/product'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/lib/utils'

export type ProductDisclosureSection = 'description' | 'details'

type ProductDetailDisclosuresProps = {
  activeSku: string | null
  expandedSection: ProductDisclosureSection | null
  onToggle: (section: ProductDisclosureSection) => void
  product: Product
  t: (key: MessageKey) => string
}

export function ProductDetailDisclosures({
  activeSku,
  expandedSection,
  onToggle,
  product,
  t,
}: ProductDetailDisclosuresProps) {
  return (
    <section className="border-b border-border">
      <DisclosurePanel
        expanded={expandedSection === 'description'}
        id="product-detail-description"
        label={t('product.description')}
        onToggle={() => onToggle('description')}
      >
        <div className="space-y-5">
          {product.descriptionHtml ? (
            // Spree serializes admin-authored rich text at the Store API boundary.
            <div
              className="prose prose-neutral prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-foreground prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="whitespace-pre-line text-lg leading-6 text-muted-foreground">
              {product.description}
            </p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              {t('product.productUnavailableDescription')}
            </p>
          )}
          {activeSku ? (
            <p className="pt-4 text-sm tracking-wider text-muted-foreground">
              {t('product.itemNumber').replace('{sku}', activeSku)}
            </p>
          ) : null}
        </div>
      </DisclosurePanel>

      <DisclosurePanel
        expanded={expandedSection === 'details'}
        id="product-detail-details"
        label={t('product.details')}
        onToggle={() => onToggle('details')}
      >
        {product.specifications.length > 0 ? (
          <dl>
            {product.specifications.map((specification) => (
              <div
                className="grid grid-cols-2 items-start gap-x-6 py-3"
                key={`${specification.label}-${specification.value}`}
              >
                <dt className="text-lg leading-6 text-muted-foreground">
                  {specification.label}
                </dt>
                <dd className="min-w-0 text-right text-lg leading-6 text-foreground">
                  {specification.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            {t('product.noAdditionalProperties')}
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
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:focus-ring"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm leading-none font-semibold tracking-wider text-foreground uppercase">
          {label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded ? 'rotate-180' : null,
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
