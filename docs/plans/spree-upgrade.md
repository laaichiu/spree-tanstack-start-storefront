# Spree upgrade plan and contract ledger

This ledger tracks the selected Spree contract and remaining release evidence.
Execution order and evidence rules belong to the
[release plan](release.md#evidence-changes-and-exit-criteria).

## Selected target

| Contract              | Value                                                          |
| --------------------- | -------------------------------------------------------------- |
| Spree                 | `6.0.0`                                                        |
| Source revision       | `661e226bd3b783b26f33f037748cc15a0f014c46`                     |
| Store SDK             | `@spree/sdk` `6.0.0`                                           |
| Runtime configuration | local path through `E2E_SPREE_DEMO_PATH` or remote attestation |

The stable source and installed SDK are source-audited. Published stable gems
now run locally with verified schema upgrades, application and audit-extension
compatibility tests, public SDK reads, commerce preflight and read-only browser
checks. Selected checkout checks pass cart reload and delivery readiness, but
Stripe test-card completion fails. Complete commerce and deployed release
evidence remain open; see the release plan.

## Status values

- `unknown`: insufficient evidence; dependent release gate remains blocked.
- `audited`: source and installed types inspected.
- `implemented`: storefront code and focused tests exist.
- `verified-local`: executable local runtime evidence passes.
- `verified-staging`: deployed staging evidence passes.

## Current contract ledger

Statuses apply only to the stated scope on the selected stable tuple. Recorded
runs are in [the runtime baseline](../../config/spree-runtime-baseline.json).
Historical RC results remain there and cannot close a stable-release gate.

| Contract                               | Current implementation or recorded evidence                                              | Status           | Remaining gate                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| SDK and public reads                   | Stable SDK pinned; local Channel, Market, Product, Category and Seller reads pass        | `verified-local` | Clean release-artifact provenance and deployed reads                                             |
| Commerce schema/provider               | Local stable migrations, upgrade tasks and test gateway preflight pass                   | `verified-local` | Re-attest provider gems, schema and configuration in the release environment                     |
| Market/Channel identity                | Guards enforce `country_codes`, owning currency and canonical Channel before mapping     | `implemented`    | Stable positive and cross-owner negative matrix                                                  |
| Cart address sessions                  | Customer-cart writes use the Account refresh boundary; guest writes use cart credentials | `implemented`    | Owner succeeds; guest, other customer and stale responses cannot write owned addresses           |
| OrderGroup and completed-Cart recovery | Order lookup, child ownership and original-credential replay guards exist                | `implemented`    | Full stable group completion, lost-response recovery, reload and unrelated-guest denial          |
| Store Credit and Gift Cards            | Balance display and Gift Card operations exist; no Store Credit apply/remove UI          | `implemented`    | Verify each enabled application/removal and full/partial completion flow on stable               |
| Price ordering                         | Application-owned database provider resolves the displayed offer before pagination       | `implemented`    | Stable context, all-page ordering and scale evidence; indexed providers need separate proof      |
| Payment and wallets                    | Stripe preparation, confirmation, recovery and deferred express UI exist                 | `implemented`    | Diagnose stable `payment_failed`; pass complete checkout and each enabled wallet/saved-card flow |
| Shared cache and optional extensions   | Local source/feature checks exist                                                        | `audited`        | Deployed Market-aware cache variation and exact enabled-extension contracts                      |
| Operations and rollback                | No deployed operational certification in the baseline                                    | `unknown`        | Jobs, mail, storage, webhooks, backup/restore, staging and rollback                              |

## Remaining stable runtime gates

- Diagnose stable guest test-card completion returning `payment_failed`, capture
  a redacted provider code and pass the complete checkout suite. Cart reload,
  delivery readiness and read-only checks pass, but do not certify payment.
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

## Stable Spree 6.0 source audit

The selected release is Spree `6.0.0` at
`661e226bd3b783b26f33f037748cc15a0f014c46`, with the matching Store SDK
`6.0.0`. The stable SDK includes maintenance-task webhook event types and documents
that direct password changes revoke refresh sessions. Storefront type-checking
and local application validation are recorded in the runtime baseline; neither
substitutes for the remaining positive and negative runtime checks below.

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

The stable source and SDK are audited, and the address-write session adaptation
has focused tests. Local stable upgrade, preflight and browser evidence is
recorded in `config/spree-runtime-baseline.json`; the table still requires its
explicit positive and negative contract checks and does not claim deployed
verification. Stable guest test-card completion returns `payment_failed` with
an unconfirmed provider cause. Diagnose it and pass the complete checkout suite
before closing the release gate.

### Stable runtime acceptance

1. Attest the exact stable backend revision and compatible payment provider for
   the release environment. Reuse the recorded local upgrade evidence only for
   its verified inputs; repeat schema/upgrade checks when those inputs change.
2. Verify owner-only cart addresses, Market/Channel/catalog isolation, private
   custom-field visibility, newsletter response privacy, delivery currency,
   and payment behavior with positive and negative cases.
3. Run read-only browser checks and the complete checkout/OrderGroup recovery
   suite. Capture redacted provider error codes; do not transfer RC5 passes or
   failures to stable without reproduction.
4. Keep staging, cache, webhook, storage, rollback and production operation
   evidence separate from local source and type checks.

### Stable sources

- [Spree 6.0 release](https://github.com/spree/spree/releases/tag/v6.0.0)
- [Store SDK manifest](https://github.com/spree/spree/blob/v6.0.0/packages/sdk/package.json)
- [Store SDK changelog](https://github.com/spree/spree/blob/v6.0.0/packages/sdk/CHANGELOG.md)
- [Cart address ownership](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/carts_controller.rb)
- [Customer balance ownership](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/carts/store_credits_controller.rb)
- [Customer password behavior](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/customers_controller.rb)
- [Buyer-scoped product filters](https://github.com/spree/spree/blob/v6.0.0/spree/api/app/controllers/spree/api/v3/store/products/filters_controller.rb)

## Post-release upstream changes to evaluate

The [6.0.0 release](https://github.com/spree/spree/releases/tag/v6.0.0) is the
selected stable release. Later commits on upstream `main` are candidates,
not part of that tag or this app's certified runtime:

- [Delivery-aware stock allocation](https://github.com/spree/spree/commit/75e29731b039e1b8211b2a6e62b17b6b695838f1)
  changes allocation and reservations when only some origins can deliver.
  Reproduce a multi-origin case on stable, compare the patch, and verify stock,
  delivery rates and reservation consistency before selecting a patched backend.
- [Wider Custom Fields expansion](https://github.com/spree/spree/commit/30493b4f8e0e0f19b1c684fd8ac34bff24f51187)
  adds optional fields to more Store API resource types. Product and Category
  expansion already exists in 6.0.0; this storefront must not assume the wider
  Seller, Address, Order or other projections exist in the pinned SDK/backend.
  Any adoption needs matching source/types, public-field privacy and runtime tests.

Recheck the official release, exact tag and SDK publication when selecting a
candidate. Moving documentation and unreleased `main` features do not change
`config/spree-6-source-target.json` automatically.

## Updating selected evidence

Update the selected baseline, focused documentation, positive and negative
tests, and evidence in the same change. Keep private environment details,
credentials, account names, and internal topology in the approved operations
system rather than this public ledger.
