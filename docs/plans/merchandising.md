# Merchandising plan

**Status:** Planned closure of existing capabilities; no new platform layer.
**Reviewed:** 2026-10-28.
**Depends on:** Stable P0-P3 contracts in the [release plan](release.md); delivers its P4 catalog gate.

## Purpose and scope

Provide reliable discovery and product-to-cart behavior without moving catalog
publication, seller ownership, price, inventory, eligibility or ordering policy
into the browser. This plan completes and verifies existing feature owners; it
does not add a theme engine, CMS, shared package or generic plugin system.

The [contract ledger](spree-upgrade.md) owns release-specific
compatibility. The [SEO plan](seo.md)
owns indexing and canonical policy. Their requirements are delivery gates,
not optional follow-up polish.

## Existing implementation and ownership

| Owner                  | Current source                                   | Audit focus                                                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Catalog                | `src/lib/catalog`, `src/components/plp`          | Listings, filters, cards, navigation and product projections  |
| Product routes         | `src/routes/$country/$locale/products`           | URL state, loader inputs, metadata and composition            |
| Categories/collections | `src/lib/catalog`, localized collection routes   | Native category tree, membership and pagination               |
| Brands                 | `src/lib/brands`, `src/config/navigation.ts`     | Optional Seller presentation and server filtering             |
| Search curation        | `src/config/search.ts`, catalog server functions | Suggested resources and explicit editorial ordering           |
| Reviews                | `src/lib/reviews`                                | Enabled deployment, customer ownership and backend moderation |
| Shell/branding         | `src/lib/storefront`                             | Normalized navigation and public Store presentation           |
| Primitives/styles      | `src/components/ui`, `src/styles`                | Accessible behavior and local semantic styling                |

Inventory the corresponding tests before creating work. Reuse a passing mapper,
controller or card; do not rewrite it solely to match this document's outline.

## Backend and frontend boundary

| Spree owns                                                 | Storefront owns                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Product, Variant, Category, Collection and Seller identity | Routes and normalized presentation contracts                    |
| Store, Channel, Market and buyer catalog visibility        | Validated URL/search state and request context                  |
| Price, compare-at, tax, stock and quantity terms           | Formatting, selection UI and understandable unavailable states  |
| Product submission, moderation and publication             | Displaying approved public data and safe missing-content states |
| Search/filter semantics and result ordering                | Accessible controls, pending state and stable pagination        |
| Review persistence, eligibility and moderation             | Enabled review forms and observable feedback                    |

No Admin key, unpublished record, private custom field or buyer-specific offer
belongs in public app configuration. Runtime response validation precedes
mapping, rendering and query caching.

## Functional contracts

### Category navigation and collections

Preserve the current native category-tree contract: public categories are
loaded in verified `lft` order, normalized by parent identity, and retain root
and sibling order. The documented seven-root presentation limit remains app
configuration; do not replace native order with name, ID or custom-field sort.

Verify backend `lft` allowlisting and actual move behavior for the selected
release. An HTTP 200 or a TypeScript sort declaration does not establish that
the backend applied the order. Missing parents are not promoted into roots.
Detect duplicate identities, cycles, invalid totals and inconsistent page
ranges. Bound scans and distinguish a complete empty result from a failure or
truncated result; never invent replacement categories.

Collection membership comes from the backend. An editorial collection page
cannot broaden into all products when its slug is unknown or its request fails.
Use typed API parameters and the owning mapper rather than hand-built requests.

### Listings, filters, sorting and pagination

The URL owns shareable search, sort, filters and page. Parse against an
allowlist, normalize invalid values, reset pagination after filter changes and
preserve browser back/forward behavior. Components do not build transport `q`
keys; the existing feature mapper and SDK own serialization.

Start independent product and facet requests concurrently. Product success with
facet failure remains a usable listing with explicit filter-unavailable state;
it is not an empty catalog. Keep active-filter chips, clear and sort usable.
Do not silently discard a failed server filter or apply a client-only filter
to a broad result set.

| Change                          | Required state handling                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Search/filter/sort/page changes | New query key; old request cannot overwrite new results                           |
| Customer or Market changes      | Invalidate private/contextual projections before rendering another owner          |
| Clear all                       | Reset allowed filters/page deterministically without unrelated URL loss           |
| Deep-link reload                | Same normalized query and result ownership as client navigation                   |
| Back navigation                 | Restore the intended query, page and usable scroll position                       |
| Out-of-range page               | Deliberate normalized redirect or empty/not-found policy; no duplicate first page |

Every ordering has deterministic ties before pagination. Price sorting must
match the displayed public offer for the active currency, catalog, quantity and
buyer context. Keep the current application-owned database provider dependency
explicit: its all-match price resolution has a scaling cost, and switching to
Meilisearch or another index requires equivalent context/ownership evidence.
Do not fetch all prices into the browser to fix server order.

Verify newest/oldest labels against the actual backend field and direction.
Show the active sort label after selection, and keep it consistent after reload
or back navigation; a label change alone does not prove different ordering.

Stable Spree 6.0 narrows facets to the buyer's catalogs and versions that cache
partition. Test listing, facet counts and allowed filter values together after
login, logout and catalog publication changes. Private fields must not reappear
in filters, sorts, suggestions or indexed documents. Stable backend runtime
evidence for these positive and negative visibility cases remains an open
release gate, even though local stable backend and read-only checks pass.

### Product-card contract

Keep one app-owned card behavior across home, listings, recommendations,
search and seller grids. Variants may change layout props, not identity rules.

- Stable media dimensions, meaningful alt text, explicit missing-image fallback
  and sensible eager/lazy loading avoid layout movement.
- Seller, title, price and color information remain adjacent. Absent optional
  rows do not create artificial blank rows or redistributed whitespace.
- Color selection preserves the selected variant's ID, offer, stock, media and
  accessible label. A missing selected price cannot borrow another price.
- Hidden, zero and unavailable prices remain distinct. Never derive a minimum
  offer by sorting raw values that the backend has not priced for this buyer.
- Links and selection buttons are separate interactive controls, with visible
  focus and appropriate disabled/pending states; avoid nested links/buttons.
- Long translations, missing sellers, image failure and slow updates preserve
  task completion at the visual-baseline viewports.

### Product-detail and add-to-cart contract

Resolve the product and its available variants in the current Market/Channel.
Validate the complete data read by media, option, specification, review and
purchase controls. Missing required expansions are unavailable data, not an
invitation to cast a partial response into a full Product.

Selection must survive a legitimate reload/deep link where supported, but an
unavailable or foreign variant cannot become the cart identity. Do not change
selected commerce state merely because a late media request completed.

| State                                     | Required behavior                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Valid selectable variant                  | Show that variant's authoritative offer, quantity terms and add action            |
| Missing selection                         | Explain the remaining options; do not submit the default variant silently         |
| Price hidden by channel                   | Show supported authentication/access action, not zero or a fabricated price       |
| Out of stock or discontinued              | Explain unavailability; only backend-approved backorder/preorder permits purchase |
| Quantity rule failure                     | Show backend minimum/maximum/step requirement and preserve input                  |
| Add succeeds then drawer/navigation fails | Preserve successful cart state; do not add again                                  |
| Concurrent customer/cart/Market change    | Ignore the old owner's response and revalidate current context                    |

Use the existing cart server boundary and synchronous duplicate prevention.
Backend recalculation and warnings determine the returned cart; UI arithmetic
cannot certify an orderable price, stock level or final total.

### Home, campaigns and search curation

Sections consume normalized resources and localized copy. They do not fetch
Spree, inspect raw SDK objects or become a second commerce policy engine.
Avoid a configurable page builder without a real product requirement.

Preserve the current search-drawer selection: storefront-visible Number Custom
Field `merchandising.search_position` on Product/Category, positive integers,
ascending order with stable identity ties, at most eight per section, and no
implicit best-seller/navigation fallback. Backend field definitions and Product
Type attachment are operator setup, not Admin API calls from the storefront.
Do not expose this editorial field as a product specification.

Clear, disabled, rejected or unpublished entries disappear after the declared
freshness interval. Search, home and header curation remain distinct. Brand
navigation comes from configured slugs and canonical public Seller data, not a
handwritten clone of seller profiles. Empty optional editorial sections may be
omitted; a failed primary catalog cannot masquerade as intentionally empty.

### Seller and Brand presentation

Keep Seller as the backend domain. Brand/Maker labels are presentation only.
Existing seller-profile routes live at a localized root slug; retain the
reserved-route collision guard in `src/config/routes.ts`.

`get-brand-products.server.ts` already sends seller ownership to Spree for both
products and facets. Verify that the configured database/index provider honors
it, including pagination and Market visibility. A correct comment or serialized
predicate is not runtime evidence. Do not filter other sellers' products in UI.

Seller-disabled deployments omit navigation and attribution without blank card
rows. Unavailable, suspended, unapproved or reserved-slug profiles use deliberate
not-found behavior and do not leak through suggestions or sitemaps. Changing
public route terminology requires redirects and the SEO plan before release.

### Reviews and optional discovery features

Reviews remain off without the existing deployment configuration and a verified
backend capability. Confirm its exact extension/version, public moderation
rules, customer ownership, edit/delete eligibility and pagination before
releasing forms. A signed-in UI is not server authorization.

Protect late responses across product and customer transitions, duplicate
submissions, validation failures and success callbacks. Only approved public
reviews may contribute to visible summaries or structured data. Aggregate
ratings must describe the same product and public review set.

Wishlist, B2B catalogs/Quotes, digital-download screens and new post-sale flows
are separate capability work. Do not create dormant menus or assume that an SDK
method supplies the missing app route, permissions and lifecycle.

## Delivery phases

### M0: Inventory and fixture contracts

- [ ] Map each existing surface to its owner, source parameters and tests.
- [ ] Define synthetic fixtures: multiple sellers, currencies, nullable offers,
      variants, private fields, deep categories and paginated catalogs.
- [ ] Attest backend `lft`, seller filtering, active search provider and relevant
      custom fields for the selected version.
- [ ] For multiple delivery origins, reproduce stock allocation, deliverability
      and reservation consistency against the pinned stable release; evaluate
      the post-release upstream fix through the contract ledger.

Exit: every listed behavior has a source or an explicit backend prerequisite.

### M1: Query and resource boundaries

- [ ] Audit URL normalization, query ownership, cancellation and pagination.
- [ ] Verify matching listing/facet scopes, publication and price-sort semantics.
- [ ] Verify incomplete scans and provider failures cannot broaden visibility.

Exit: M01-M07 pass against the configured backend, not only mocked responses.

### M2: Cards and product selection

- [ ] Consolidate only genuinely duplicated card behaviors into the existing
      app-owned contract; keep optional information layout intentional.
- [ ] Verify variant selection, hidden prices, quantity rules and add-to-cart.
- [ ] Cover media errors, translations, accessibility and stale responses.

Exit: M08-M13 pass on all listing and detail entry points.

### M3: Editorial and navigation closure

- [ ] Verify category move ordering and complete bounded tree loading.
- [ ] Exercise home, campaign and search-field setup/change/clear behavior.
- [ ] Verify branding fallback and omission of unavailable curated entries.

Exit: editorial intent survives publication changes without private-data leaks.

### M4: Sellers and enabled reviews

- [ ] Verify root-slug collisions and seller-disabled behavior.
- [ ] Prove products/facets remain seller-scoped before and after pagination.
- [ ] Close extension moderation/ownership evidence for enabled review forms.

Exit: every exposed optional entry point has a working authorized destination.

### M5: Responsive and performance verification

- [ ] Run visual-baseline viewport, keyboard, focus, touch and reduced-motion
      checks; test long content and slow/error states.
- [ ] Measure route requests and media delivery; preserve existing build budgets.
- [ ] Load heavy drawers/reviews only where useful without degrading primary SSR.

Exit: measured behavior meets the declared profile without dropping safeguards.

### M6: Integrated acceptance

- [ ] Re-run discovery-to-product-to-cart flows with the selected backend.
- [ ] Apply SEO canonical/index rules and test disabled/unavailable resources.
- [ ] Record capability evidence in the release gate and remove obsolete paths
      only after their supported consumers and tests are accounted for.

Exit: the public catalog is coherent across routes, API scopes and UI states.

## Acceptance matrix

| ID  | Scenario                                           | Required result                                                 |
| --- | -------------------------------------------------- | --------------------------------------------------------------- |
| M01 | Search/filter/sort deep link and browser back      | Stable normalized URL and matching results                      |
| M02 | Malformed, repeated or unsupported filter values   | Deliberate rejection/normalization; no accidental broad search  |
| M03 | Facets fail while products succeed                 | Products remain; explicit filter failure and working clear/sort |
| M04 | Two sellers across several result pages            | No foreign products or facet counts                             |
| M05 | Currency/catalog/quantity-dependent price ordering | Same offer as the card, stable ties, no duplicate/missing pages |
| M06 | Customer or Market changes during request          | Old projection cannot render as the new context                 |
| M07 | Private custom field appears in index/filters      | Not exposed; backend contract failure is visible                |
| M08 | Variant has no price, media or availability        | No value borrowed from another variant                          |
| M09 | Missing seller/color and long translated title     | Compact stable layout without placeholder rows                  |
| M10 | Keyboard card link and color selection             | Separate named controls and visible focus                       |
| M11 | PDP requires selection or has invalid variant      | No silent default/foreign variant submission                    |
| M12 | Min/step/max, unavailable or backorder condition   | Backend rule and response govern the purchase action            |
| M13 | Add succeeds but a UI callback throws              | Successful cart retained; no second add                         |
| M14 | Category move, missing parent, duplicate or cycle  | Native order retained or malformed tree rejected                |
| M15 | Search position is cleared, invalid or tied        | Deterministic bounded curation, no invented fallback            |
| M16 | Seller disabled, unavailable or route-reserved     | No broken entry or route shadowing                              |
| M17 | Optional review extension disabled/unavailable     | No misleading form or unapproved public review data             |
| M18 | Review owner changes or submits twice              | Authorization and duplicate prevention still hold               |
| M19 | Pagination cap or mid-scan failure                 | Partial data is not declared a complete catalog                 |
| M20 | Image failure, mobile landscape and reduced motion | Usable layout, controls and focus without budget regression     |

## Completion and references

The maintainer delivers the existing owner-level tests, relevant browser checks,
backend-filter evidence, required operator setup and failure/recovery behavior.
No task is complete merely because a component renders a happy-path fixture.
Do not add a global CSS utility or new package to satisfy a single surface.

- [Current architecture](../guides/architecture.md)
- [Visual baseline](../guides/ui.md)
- [Source-backed migration ledger](spree-upgrade.md)
- [Spree 6.0 product-filter scope](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/products/filters_controller.rb)
- [Spree 6.0 cart item workflow](https://github.com/spree/spree/blob/v6.0.0/spree/core/app/workflows/spree/carts/upsert_items.rb)
