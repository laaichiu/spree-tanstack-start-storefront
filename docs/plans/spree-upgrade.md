# Spree upgrade plan and contract ledger

This ledger tracks the selected Spree contract and remaining release evidence.
Execution order and evidence rules belong to the
[release plan](release.md#evidence-changes-and-exit-criteria).

## Selected target

| Contract              | Value                                                          |
| --------------------- | -------------------------------------------------------------- |
| Spree                 | `6.0.1`                                                        |
| Source revision       | `49d72a8d982f3fb17231348fd45fd6bf6a2fdc2d`                     |
| Store SDK             | `@spree/sdk` `6.0.1`                                           |
| Runtime configuration | local path through `E2E_SPREE_DEMO_PATH` or remote attestation |

The 6.0.1 source and installed SDK are audited for the Store SEO contract. The
local `spree-demo` lockfile declares published 6.0.1 gems, but the endpoint
response and broader 6.0.1 runtime have not been reverified. The previous
6.0.0 runtime results remain historical; see the release plan for open gates.

## Status values

- `unknown`: insufficient evidence; dependent release gate remains blocked.
- `audited`: source and installed types inspected.
- `implemented`: storefront code and focused tests exist.
- `verified-local`: executable local runtime evidence passes.
- `verified-staging`: deployed staging evidence passes.

## Current contract ledger

Statuses apply only to the stated scope on the selected tuple. Recorded runs
are in [the runtime baseline](../../config/spree-runtime-baseline.json).
Historical 6.0.0 results cannot close a 6.0.1 release gate.

| Contract                               | Current implementation or recorded evidence                                                             | Status        | Remaining gate                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| SDK and public reads                   | 6.0.0 Channel, Market, Product, Category and Seller reads are historical; 6.0.1 Store types are audited | `audited`     | Probe 6.0.1 Store SEO response and reverify release-artifact reads                               |
| Storefront Store SEO                   | Server loader calls `store.get` and maps nullable title/description; no 6.0.1 response captured         | `audited`     | Verify requested/default locales, malformed responses and rendered home metadata                 |
| Commerce schema/provider               | Local migration, upgrade and gateway checks cover 6.0.0 only                                            | `unknown`     | Re-attest 6.0.1 provider gems, schema and configuration                                          |
| Market/Channel identity                | Guards enforce `country_codes`, owning currency and canonical Channel before mapping                    | `implemented` | Stable positive and cross-owner negative matrix                                                  |
| Cart address sessions                  | Customer-cart writes use the Account refresh boundary; guest writes use cart credentials                | `implemented` | Owner succeeds; guest, other customer and stale responses cannot write owned addresses           |
| OrderGroup and completed-Cart recovery | Order lookup, child ownership and original-credential replay guards exist                               | `implemented` | Full stable group completion, lost-response recovery, reload and unrelated-guest denial          |
| Store Credit and Gift Cards            | Balance display and Gift Card operations exist; no Store Credit apply/remove UI                         | `implemented` | Verify each enabled application/removal and full/partial completion flow on stable               |
| Price ordering                         | Application-owned database provider resolves the displayed offer before pagination                      | `implemented` | Stable context, all-page ordering and scale evidence; indexed providers need separate proof      |
| Payment and wallets                    | Stripe preparation, confirmation, recovery and deferred express UI exist                                | `implemented` | Diagnose stable `payment_failed`; pass complete checkout and each enabled wallet/saved-card flow |
| Shared cache and optional extensions   | Local source/feature checks exist                                                                       | `audited`     | Deployed Market-aware cache variation and exact enabled-extension contracts                      |
| Operations and rollback                | No deployed operational certification in the baseline                                                   | `unknown`     | Jobs, mail, storage, webhooks, backup/restore, staging and rollback                              |

## Remaining 6.0.1 runtime gates

- Verify the Store SEO endpoint response for default and translated locales,
  including malformed data rejection and the rendered SSR home metadata.
- Diagnose whether 6.0.0's guest test-card `payment_failed` reproduces on 6.0.1,
  capture a redacted provider code and pass the complete checkout suite.
- Verify lost-response OrderGroup recovery and wallet callbacks on stable.
  Historical RC full-balance and group results do not establish these outcomes.
  Backend-applied Store Credit fixtures do not certify a storefront balance UI.
- Verify requirement codes, unknown extension requirements, completion-only
  refusals and visible warning feedback. The current mapper omits requirement
  `code`; empty advisory requirements do not guarantee successful completion.
- Revalidate price-ordering context and scalability for the release catalog.
  The application fix is local to the Store API database provider; an index
  does not inherit it.
- Verify deployed Market-aware shared-cache behavior and every enabled optional
  extension. Account for local-fixture-only skips in remote browser runs.

## Selected Spree 6.0.1 source audit

The selected target is Spree `6.0.1` at
`49d72a8d982f3fb17231348fd45fd6bf6a2fdc2d`, with `@spree/sdk` `6.0.1`.
The 6.0.1 source adds the public `GET /api/v3/store/store` endpoint and the
Store SDK exposes it as `client.store.get({ locale })`. It returns `id`,
`name`, `seo_title`, and `meta_description`; translated fields use the
requested locale and fall back to the Store's default locale. The storefront
now calls this method from its server-only branding loader, validates the
Store identity and nullable SEO fields, and maps them to its app-owned
branding contract. The home route already gives Store SEO title/description
precedence over localized defaults. The actual 6.0.1 response and positive
and negative runtime cases are not yet verified.

### Historical Spree 6.0.0 source and runtime audit

The previous selected release was Spree `6.0.0` at
`661e226bd3b783b26f33f037748cc15a0f014c46`, with the matching Store SDK
`6.0.0`. The stable SDK includes maintenance-task webhook event types and documents
that direct password changes revoke refresh sessions. Storefront type-checking
and local application validation are recorded in the runtime baseline; neither
substitutes for the remaining positive and negative runtime checks recorded for
that 6.0.0 target.

| Stable behavior                         | Storefront audit                                                                                                                                                                         | Remaining runtime evidence                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Customer-cart address ownership         | Checkout and express address writes now use the Account session refresh boundary; guest carts retain cart-token-only writes. Failed customer auth cannot fall back to guest credentials. | Verify the owner succeeds and a guest token or another customer cannot write an owned cart's addresses.                            |
| Store Credit ownership                  | Storefront reads and displays balances but has no apply/remove balance mutation. No client path can spend Store Credit.                                                                  | Verify that no unsupported endpoint is exposed by the deployed backend configuration.                                              |
| Password changes revoke sessions        | Profile updates do not change passwords. Password reset uses the password-reset contract and persists its returned token pair.                                                           | If direct password editing is added, verify that old refresh credentials fail while a network error preserves the current session. |
| Buyer-scoped filters and cache          | Listing/filter calls use the Market-bound Store client. This storefront has no company/catalog selector or customer-scoped catalog UI.                                                   | Verify listing and facets agree across Market, Channel and catalog publication changes.                                            |
| Private custom fields                   | Search suggestions filter on the configured `merchandising.search_position` field; the field must be storefront-visible. No general private-field filter UI exists.                      | Verify the field's visibility and ensure admin-only fields are absent from every configured search/filter provider.                |
| Newsletter identity                     | The server wrapper discards the SDK subscriber response and returns only neutral accepted/unsupported state.                                                                             | Verify public subscribe responses reveal neither customer identity nor whether an account exists.                                  |
| Delivery currency                       | Shipping amounts are mapped using the owning Cart currency, and the UI uses only returned delivery rates.                                                                                | Verify supported/unsupported Market currency behavior and selected-rate retention after cart edits.                                |
| Payment amounts                         | Storefront payment flows use Spree totals and do not calculate or submit arbitrary payment amounts.                                                                                      | Verify zero-due, partial-balance, invalid capture and over-capture behavior on the stable backend/provider.                        |
| API indexing headers                    | SSR page metadata is app-owned; SDK response headers are not forwarded into public HTML.                                                                                                 | Verify public pages remain indexable and private responses are not publicly cached.                                                |
| Webhook SDK events                      | The stable SDK adds `maintenance_task_run.*` event types. This storefront has no webhook receiver or subscription management UI.                                                         | No storefront migration is required unless a webhook consumer is introduced.                                                       |
| Store-scoped resources and API security | Requests use the configured Store client and existing identity, Market and Channel guards.                                                                                               | Exercise positive and cross-store/owner negative responses on the stable backend.                                                  |

Those source and SDK checks, address-write tests, local upgrade and browser
results apply to 6.0.0 only. Stable guest test-card completion returned
`payment_failed` with an unconfirmed provider cause. Do not transfer those
results to 6.0.1 or close the current release gate from the historical evidence.

### Spree 6.0.1 runtime acceptance

1. Attest the exact 6.0.1 backend revision and compatible payment provider for
   the release environment. Reuse the recorded 6.0.0 local upgrade evidence
   only for its verified inputs; repeat schema/upgrade checks for 6.0.1.
2. Verify owner-only cart addresses, Market/Channel/catalog isolation, private
   custom-field visibility, newsletter response privacy, delivery currency,
   and payment behavior with positive and negative cases.
3. Verify the Store SEO endpoint with the requested and default locales, then
   run read-only browser checks and the complete checkout/OrderGroup recovery
   suite. Capture redacted provider error codes; do not transfer earlier passes
   or failures to 6.0.1 without reproduction.
4. Keep staging, cache, webhook, storage, rollback and production operation
   evidence separate from local source and type checks.

### Historical 6.0.0 sources

- [Spree 6.0 release](https://github.com/spree/spree/releases/tag/v6.0.0)
- [Store SDK manifest](https://github.com/spree/spree/blob/v6.0.0/packages/sdk/package.json)
- [Store SDK changelog](https://github.com/spree/spree/blob/v6.0.0/packages/sdk/CHANGELOG.md)
- [Cart address ownership](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/carts_controller.rb)
- [Customer balance ownership](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/carts/store_credits_controller.rb)
- [Customer password behavior](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/customers_controller.rb)
- [Buyer-scoped product filters](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/products/filters_controller.rb)

## Post-release upstream changes to evaluate

The [6.0.1 release](https://github.com/spree/spree/releases/tag/v6.0.1) is the
selected stable release. Later commits on upstream `main` are candidates, not
part of that release. The 6.0.1 source also changes stock allocation and
expands Store API custom-field projections; this storefront has not adopted
those optional capabilities. Audit each contract before using it.

Recheck the official release, exact tag and SDK publication when selecting a
candidate. Moving documentation and unreleased `main` features do not change
`config/spree-6-source-target.json` automatically.

## Updating selected evidence

Update the selected baseline, focused documentation, positive and negative
tests, and evidence in the same change. Keep private environment details,
credentials, account names, and internal topology in the approved operations
system rather than this public ledger.
