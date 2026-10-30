# SEO and branding plan

**Status:** Planned verification and targeted corrections to existing routes.
**Reviewed:** 2026-10-28.
**Depends on:** Verified catalog/Market identity and P0-P4 of the
[release plan](release.md).

## Scope and ownership

The storefront owns URL composition, SSR metadata, structured data, public
branding and localized discovery. Spree owns publication, seller identity,
Channel/Market access, product offers and availability. SEO cannot invent an
offer, bypass a gated channel or publish an unavailable resource.

This plan works with the [merchandising plan](merchandising.md)
and [contract ledger](spree-upgrade.md). Keep one SEO policy and
one set of app-owned selectors; do not rebuild it separately in every route.

## Existing implementation and concrete audit targets

| Owner                | Existing source                                               | Remaining requirement                                                               |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| URL and head helpers | `src/lib/seo`                                                 | Safe public origin, canonical/query policy and correct SSR/head updates             |
| Listing metadata     | Catalog SEO contracts and localized product/collection routes | Preserve pagination identity; exclude arbitrary search/facet variants               |
| Product JSON-LD      | `src/lib/catalog/utils/catalog-seo.ts`                        | Match actual server-rendered offer; omit incomplete hidden-price offers             |
| Locale alternates    | `src/lib/seo/alternate-locale.ts`                             | Prove resource availability and translated slug; prefix replacement is insufficient |
| Sitemap data         | `src/lib/catalog/api/get-catalog-sitemap.server.ts`           | Complete bounded pagination, country context and explicit upstream failure behavior |
| XML and robots       | `src/routes/sitemap[.]xml.ts`, `src/routes/robots[.]txt.ts`   | Correct status, content type, cache, shards and public origin                       |
| Branding             | `src/lib/storefront`, `src/lib/env/public.ts`                 | Valid public assets/copy and deliberate precedence                                  |
| Security headers     | `src/start.ts`, response-header owners                        | No private indexing and no accidental API noindex on public pages                   |

Current sitemap code bounds scans but can return a capped or failed resource
set as an empty/partial successful catalog. It reads one country per Market
context and copies that result to other countries. These are verification and
correction targets, not certified evidence of country-equivalent publication.
Product loading can also return an unavailable component after an upstream
failure: verify the HTTP status, not only the rendered message or robots tag.

## Route and indexing contract

| Surface                                          | Indexing policy                              | Canonical and response behavior                                        |
| ------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------- |
| Localized home                                   | Index when public and successful             | Self-canonical, verified public origin                                 |
| Base products/collection listing                 | Index when published and successful          | Self-canonical, normalized slug/context                                |
| Plain pagination                                 | Indexable distinct pages                     | Preserve normalized page number; page 1 omits the redundant parameter  |
| Search, filter and alternative-sort combinations | noindex, follow by default                   | Stable normalized URL; no claim that every filtered page equals page 1 |
| Product                                          | Index only when publicly accessible          | Published slug and verified Market/locale; correct 404 when absent     |
| Brands directory and root-slug Seller profile    | Only when enabled and public                 | Reserved-route guard and verified seller-specific path                 |
| Policy                                           | Index only approved public localized content | Stable slug and real not-found behavior                                |
| Account/cart/checkout/payment/confirmation       | noindex and private/no-store                 | Never sitemap candidates; authorization independent of robots          |
| Unavailable/malformed resource                   | No rich result or alternate claims           | Actual 404 for absence; appropriate 5xx for transient upstream failure |
| Preview/staging/internal server routes           | No indexing                                  | Environment policy and access controls where needed                    |

Do not canonicalize every paginated listing to page 1. Google recommends a
unique URL and self-canonical for each page in a sequence. Keep crawlable next
page links even when the interface supports incremental loading. Sorting,
facets and tracking parameters must not accidentally create an unbounded
indexable URL space.

A future indexable campaign/filter landing page needs a real public content
identity, publication rules and explicit canonical policy. It is not enabled by
allowing an arbitrary query string into the sitemap.

## URL, redirects and HTTP behavior

Use the validated configured public origin. Production must not derive canonical
hosts from an untrusted Host/forwarded header or silently fall back to a local
origin. Preview deployments must not emit production-indexable preview URLs.

Normalize country, locale casing, slugs, trailing slash and query ordering
consistently. Preserve supported search state on redirects; reject external or
protocol-relative return targets. Unknown country/locale combinations require a
deliberate supported-market fallback or not-found outcome, not a redirect loop.

Use permanent redirects only for stable canonical changes with known target
identity. Session/cookie-driven default-region selection remains a temporary
redirect; do not permanently assign every visitor to the first observed Market.
Slug/route changes require an explicit redirect map and collision tests.

A not-found component alone does not establish a 404, and noindex alone does not
make a 200 error page correct. Test SSR and direct HTTP responses, client
navigation, reload and backend outage separately. Never forward the Store API's
noindex header blindly onto a public product page.

## Metadata, SSR and brand identity

Every public route owns intentional title, description, canonical, robots,
social image and locale metadata through shared normalized helpers. Raw SDK
resources do not enter route head functions. Public product/category/policy
content and primary metadata should be present in the initial SSR response.
Global and market-level not-found responses emit localized `noindex` metadata;
market-level not-found titles include the matching Store name when available.

Test hydration and client navigation for duplicate or stale head tags after
Market, slug or route changes. Prevent waterfalls that serialize independent
catalog data behind message loading. Nonessential reviews or recommendations
must not delay primary product content.

Spree 6.0.1 exposes the current Store's public name, `seo_title`, and
`meta_description` from `GET /api/v3/store/store`, localized by the request's
`X-Spree-Locale` and defaulting individual untranslated fields to the Store's
default locale. The server-only Storefront branding loader calls
`client.store.get({ locale })`, validates the Store identity and nullable text,
then maps those values into the app-owned contract. The home page uses the
Store SEO title and description before localized app copy. Append the Store
name to the selected title unless that title is just the Store name. Do not
detect an existing `| Store name` suffix. For resource pages, resolve
description from resource metadata, resource description, Store metadata, then
localized fallback. Other pages prefer explicit route descriptions, then Store
metadata, then localized fallback. Store name is read from the Store API and is
required to be non-empty; it is not configured in the storefront environment.
If the API request fails, localized generic app copy is used temporarily. Keep
header, footer, page titles, social cards and structured data consistent. Do
not use workstation, repository or account names as public branding. The 6.0.1
API response and locale fallback still need runtime verification.

Logos and social images need safe public URLs, dimensions and useful alt text.
Seller labels are app terminology; Seller identity remains the backend domain.
Seller-disabled deployments omit navigation and attribution coherently.

## Locale alternates and resource publication

A supported Market/locale pair does not prove that every product or slug exists
there. The current alternate helper replaces URL prefixes using Market options;
that is a candidate generator, not proof of resource-level publication.

Build alternate links from verified localized resource identity using bounded
lookups or an explicitly maintained public resource projection. If that evidence
is unavailable, emit a conservative valid subset rather than guessed links.
Do not perform unbounded per-locale requests during every page render.

- Validate actual country/locale membership using canonical codes.
- Resolve translated slugs/permalinks instead of copying the source slug.
- Include the current page and reciprocal reachable equivalents.
- Exclude missing, redirected, private and unavailable targets.
- Use valid language-region values; x-default points only to an intentional
  reachable default or selector, not a guessed product URL.
- Keep canonicals, HTML alternates and sitemap alternates consistent.

## Structured-data contract

Product data must describe the publicly visible product and offer in the same
Market and currency as the server-rendered page. Current code uses the declared
default Variant, falls back to the first Variant when no default ID is declared,
and can use the parent price when no offer Variant is resolved. It does not
receive a URL-selected Variant from the product route. It also emits an Offer
object when price/currency are absent. Audit these fallbacks and omit incomplete
offers; selected-variant SEO and that omission are not already implemented.

For the existing single-product canonical, use a verified default/public offer
consistent with visible content. If variant-specific URLs become a requirement,
first define URL parsing, canonical/alternate policy and SSR selection, then
project that exact variant. Never combine one variant's SKU with another price.

| Data                            | Required source and exclusion rule                                             |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Product name/description/images | Public normalized content; safe text and image URLs                            |
| SKU/offer identity              | The same verified variant represented by the visible offer                     |
| Price/currency                  | Validated decimal and owning currency; hidden/null values are not zero         |
| Availability                    | Backend purchasability, stock and preorder/backorder contract                  |
| Seller/brand                    | Verified public identity; do not confuse marketplace operator with each seller |
| Rating/reviews                  | Enabled, approved public reviews for this exact product                        |
| Breadcrumbs                     | Reachable, public, verified ancestry and current localized routes              |
| Organization/WebSite            | Public deployment identity and intentional search behavior                     |

If a public Offer lacks required price/currency, omit the Offer rather than emit
an incomplete priced offer. Do not create fake ratings, shipping costs, return
policies or identifiers to satisfy a validator. Distinguish display formatting
from authoritative money calculation.

Serialize JSON-LD safely against script-breaking content and retain the app's
CSP/nonce contract. Rendered JSON must parse; malicious names or descriptions
cannot terminate the script element. Rich-result eligibility is external
validation, not a promise made by a local unit test.

## Sitemap and robots implementation

### Completeness, context and bounded work

Generate only successful, public resource URLs for the configured origin and
Channel. Never use a visitor JWT, private customer pricing or account state to
populate a shared sitemap response.

Each pagination layer validates counts, ranges, identities and completion.
Reaching a scan cap or receiving an invalid page is not successful completion.
Do not silently publish the first capped pages as the complete catalog.

Build country-specific results when publication/access differs. Reuse a result
across countries only after verifying the exact equivalence contract; shared
Market/currency alone is insufficient evidence. Normalize and deduplicate URLs
without discarding real localized identity.

The current all-resources scan and Market batching must fit Worker request,
subrequest, memory and latency budgets. Prefer bounded public sitemap shards
with a declared freshness policy. Precomputation/storage is justified only with
an actual scale requirement, defined owner and recovery behavior; it is not a
reason to add an unrelated CMS or backend service.

### Error, freshness and format behavior

Required product/category source failure returns an unavailable/5xx result or an
explicitly verified last-good artifact with a bounded age. Optional disabled
resources may be absent; a failed enabled resource is not the same as disabled.
Never cache an accidental empty result as a successful complete sitemap.

Sitemap indexes and shards have correct XML escaping, absolute URLs, content
type, size/URL limits and stable part selection. Last-modified values must come
from a supported meaningful source, not the current time on every generation.
Invalid shard selection receives a genuine not-found response.

robots.txt references the same public sitemap origin and uses the deliberate
environment policy. Robots rules do not authorize access, and a crawl block
must not be the sole mechanism used to remove already indexed private pages.
Security controls and noindex on private responses remain independent.

## Delivery phases

### S0: Source and policy inventory

- [ ] Map every existing route and head helper to the route policy table.
- [ ] Record supported Markets, public resource identity, optional sellers and
      approved branding/policy inputs using neutral fixtures.
- [ ] Identify default-variant JSON-LD, alternate-prefix and capped/partial
      sitemap behavior as explicit work items, not assumed compliance.

Exit: a complete route-policy matrix and named owner for each correction.

### S1: Canonical, status and redirect closure

- [ ] Make pagination self-canonical and preserve supported query identity.
- [ ] Separate missing resources from transient backend errors and verify
      actual SSR status codes and private noindex responses.
- [ ] Test safe origins, temporary region routing and stable slug redirects.

Exit: S01-S06 pass for direct requests and client navigation.

### S2: Localized identity and alternates

- [ ] Define bounded publication evidence and translated-slug resolution.
- [ ] Generate only reachable reciprocal alternates and intentional x-default.
- [ ] Keep Market switching, canonical paths and sitemap URLs consistent.

Exit: S07-S09 pass without guessed cross-Market resource URLs.

### S3: Metadata, structured data and branding

- [ ] Match visible product/default offer and omit incomplete offers.
- [ ] Verify breadcrumbs, enabled review aggregates and safe JSON-LD rendering.
- [ ] Apply consistent branding fallback and owner-approved policy content.

Exit: S10-S13 pass in SSR output, hydration and external schema validation.

### S4: Bounded sitemap and robots

- [ ] Verify all pages or implement bounded shards; fail explicitly on caps,
      source failures and inconsistent pagination.
- [ ] Prove anonymous/country context, safe freshness and format limits.
- [ ] Validate missing shards and preview/production robots behavior.

Exit: S14-S17 pass without partial success disguised as completeness.

### S5: Integrated browser and deployed checks

- [ ] Inspect raw response status/headers, rendered head/JSON-LD and links at
      the visual-baseline viewports on the exact staging artifact.
- [ ] Test supported locale/slug combinations, outages and disabled features.
- [ ] Check search-engine tooling with the approved public staging strategy;
      do not remove preview protection merely to make a test pass.

Exit: the release owner has deployed evidence and understood external warnings.

### S6: Promotion and maintenance

- [ ] Include SEO checks in the existing release process and rollback smoke.
- [ ] Treat route renames, domain changes, country/locale additions and new
      indexable landing pages as contract changes requiring revalidation.
- [ ] Keep unfinished work here; update current architecture only when behavior
      changes, without adding a chronological implementation log.

Exit: public discovery remains correct for the selected released capability set.

## Acceptance matrix

| ID  | Scenario                                                      | Required result                                                            |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| S01 | Base listing and page 2 contain different products            | Distinct self-canonicals; crawlable pagination                             |
| S02 | Sort/filter/search/tracking variants                          | Deliberate noindex/query policy; no unbounded index space                  |
| S03 | Product truly absent versus API timeout                       | Actual 404 versus appropriate unavailable/5xx behavior                     |
| S04 | Forwarded/Host header or invalid public origin                | No attacker/local canonical or sitemap URL                                 |
| S05 | Cookie-driven region redirect and slug rename                 | Temporary preference redirect, intentional permanent identity redirect     |
| S06 | Private route or API noindex header reaches app               | Private pages protected; public pages do not inherit unrelated API noindex |
| S07 | Product absent in one otherwise supported Market              | No alternate or sitemap URL asserting it exists                            |
| S08 | Translated slug and reciprocal alternate pair                 | Reachable correct URLs in both directions                                  |
| S09 | Regional locale casing and x-default                          | Valid codes and an intentional reachable default                           |
| S10 | Default offer differs from another selected/displayed variant | Consistent identity/price or deliberate variant-URL design                 |
| S11 | Hidden/null price or unsupported public review                | No zero/incomplete Offer or fabricated aggregate                           |
| S12 | Malicious script-breaking title/description                   | Safe parseable JSON-LD, intact CSP and document                            |
| S13 | Branding absent, long or seller-disabled                      | Consistent neutral fallback without private data                           |
| S14 | Page scan exceeds cap or fails mid-resource                   | Explicit failure/verified bounded artifact, not false complete success     |
| S15 | Countries in one Market have different visibility             | No first-country result copied without evidence                            |
| S16 | Sitemap shard missing, oversized or malformed                 | Correct XML limits, content type and genuine error status                  |
| S17 | Logged-in visitor requests shared sitemap                     | Only public anonymous data; no buyer-specific publication                  |
| S18 | Hydration/navigation/rollback changes page identity           | Head tags, status, links and public origin stay coherent                   |

## Completion and references

All applicable S01-S18 scenarios need selector, route and deployed evidence;
metadata snapshots alone are insufficient. Legal content is supplied and
approved by the operator outside the repository. No external service account,
search-console submission or production publish is part of this planning task.

- [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Google localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [TanStack execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
- [Current app architecture](../guides/architecture.md)
