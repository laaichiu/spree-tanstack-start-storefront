# Architecture

## Application boundary

This repository contains one independently deployed TanStack Start storefront.
It owns the route tree, Cloudflare Worker, public origin, publishable key,
Channel, cookies, cache policy, release, and rollback. Spree may serve other
clients, but this application owns only its own presentation and state.

## Source ownership

```text
src/routes
  URL parsing, loaders, redirects, SEO, error boundaries, and page composition

src/components
  app-owned presentation, copy, responsive layout, and local interaction

src/components/ui
  accessible, business-free React primitives and class composition helpers

src/config
  navigation, footer, search curation, and reserved route configuration

src/styles
  semantic tokens and the smallest necessary global CSS surface

src/lib/<feature>
  feature-owned server functions, sessions, mappers, queries, and lifecycle

src/lib/core
  pure app contracts, runtime-independent validation, and selectors

src/lib/runtime
  SDK client construction, Channel guards, code normalization, and money formatting

src/lib/spree
  existing server client factory, request configuration, and SDK error readers
```

Routes own params, search parsing, loaders, redirects, SEO, error boundaries,
and page composition. Feature lifecycle stays in `src/lib/<feature>`. Components
consume normalized feature contracts and do not own SDK resources or sessions.
The existing `src/lib/spree` adapter reads server environment values and delegates
to Runtime. Routes and components reach it through feature server functions.
Branding and feature configuration stay with their owners in `src/lib/<feature>`;
Worker and build configuration live in `wrangler.jsonc` and `vite.config.ts`.

Keep code in the feature that owns its identity, lifecycle, and error semantics.
Do not extract a package, feature flag, plugin layer, or catch-all shared module
without a real second consumer and a stable contract.

## Spree integration

Spree remains authoritative for publication, seller ownership, Channel
visibility, price, inventory, quantity terms, cart, checkout, tax, shipping,
payment, and orders. Storefront code validates and presents those decisions; it
does not reproduce them in the browser.

The selected Spree contract uses `country_codes` for Market geography. Cart and
Order responses must include the canonical configured Channel ID. A missing or
mismatched owner fails before mapping, persistence, or caching.

Commerce requests follow one path:

```text
route or component
  -> feature query or server function
  -> Channel-bound @spree/sdk request
  -> runtime identity and ownership guard
  -> feature mapper
  -> normalized contract
  -> query cache or UI
```

Routes and components do not import `@spree/sdk` or call Spree directly.

Header and mobile category navigation use the backend category tree directly.
All public category pages are read in nested-set order (`sort: 'lft'`) without
relationship expansions. The complete flat list is normalized into a tree by
`parent_id`, preserving native root and sibling order at every level. Root
categories are limited to seven. The dashboard's drag-and-drop moves update this
same nested-set order. The storefront does not sort by names, IDs, the serialized
`position`, or a Custom Field. Names, localized permalinks, and images come from
Spree. Page counts, ranges, and record counts must remain consistent across a
load; duplicate identities and cyclic parent chains fail before presentation.
Loads are bounded to 100 pages of 100 records. Missing parents are omitted from
the root navigation rather than promoted. Empty or failed loads do not produce
handwritten replacement categories.

The integration backend must allow sorting Category by its existing `lft`
column. Register it through Spree's Ransack configuration in the Rails application's
initializer, then restart Rails:

```ruby
Rails.application.config.to_prepare do
  Spree.ransack.add_attribute(Spree::Category, :lft)
end
```

This uses the native tree ordering without a schema change or a dashboard extension.
Navigation does not consume the search drawer's merchandising fields.

The Brands navigation selection lives in `src/config/navigation.ts`: `slugs`
sets the curated list order, and `featuredSlug` selects the image link. The
Brands feature resolves only these public Seller profiles for the active Market,
uses the configured Seller cover photo, and omits unavailable entries. The shell
receives normalized navigation items rather than full profiles or SDK resources.

The search drawer's Suggested items and Categories are curated independently of
the homepage and header navigation. A storefront-visible Number Custom Field
named `merchandising.search_position` on Product and Category selects each
entry: positive integers are ordered ascending, with resource ID breaking ties.
Cleared values, zero, negative values, and fractions are excluded. Each section
shows at most eight entries, with no automatic best-seller or navigation fallback.
The Product definition must be sortable so the Store API can filter it. Both
resources are paged by ID, then the complete selection is ordered by configured
position in the mapper; equal positions cannot destabilize backend pagination.
Attach it to the relevant Product Types as an optional field so their product
editing forms expose it; products without a type show all Product definitions.
Category selection reads all public category pages with `custom_fields` expanded,
then validates and selects records, including child categories. Both sections
use the active Market and Channel through the catalog server boundary and
separate market-scoped queries with a one-minute freshness window. Clearing the
field removes an entry after the next fresh request. This merchandising field
is excluded from product specification tables.

Catalog facets are optional to product rendering. A failed facet request keeps
the product listing available, emits a redacted feature error, and displays a
localized unavailable status rather than silently presenting an empty filter
set. Sorting and clearing already-applied filters remain available. An empty
mobile filter drawer stays disabled until usable facets are available.

## Deployment boundary

HTML, server functions, account, cart, checkout, and private paths are never
publicly cacheable. The deployed Worker owns its CSP, cache policy, and release.
A frontend release does not imply a backend migration or release.
