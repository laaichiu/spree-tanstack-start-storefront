# Spree integration

## Selected contract

| Contract           | Selected value                             |
| ------------------ | ------------------------------------------ |
| Spree              | `6.0.0`                                    |
| Source revision    | `661e226bd3b783b26f33f037748cc15a0f014c46` |
| Source description | `v6.0.0`                                   |
| Store SDK          | Exactly `@spree/sdk` `6.0.0`               |
| Selection date     | 2026-10-28                                 |

`config/spree-6-source-target.json` selects the contract.
`config/spree-runtime-baseline.json` records executable evidence and its
provenance. The stable source and installed SDK have been audited. The local
backend now runs published stable gems with verified migrations, upgrade tasks,
application and audit-extension compatibility tests, public SDK reads,
commerce preflight and read-only browser checks. RC3, RC4 and RC5 results remain
historical evidence. Selected stable checkout checks pass cart reload and
delivery readiness, but Stripe test-card completion returns `payment_failed`.
The provider cause is unconfirmed and the complete checkout gate remains open.

A local Rails integration application is configured with
`E2E_SPREE_DEMO_PATH`; remote environments attest their version with
`E2E_SPREE_BACKEND_VERSION` and may provide source provenance through
`E2E_SPREE_BACKEND_REVISION`. Verify which backend the Worker actually calls;
a version declaration or successful type check alone is not runtime evidence.

The [contract ledger](../plans/spree-upgrade.md) separates the stable source
audit from backend runtime evidence. Spree 6.0 aligns the Store SDK version
with the backend release; Admin/Seller SDK versions remain independent.
Production and checkout evidence remain gated by the
[release plan](../plans/release.md).

Use the [official release](https://github.com/spree/spree/releases/tag/v6.0.0)
and its pinned source for this contract. Upstream documentation can describe
unreleased `main` behavior. The ledger separately tracks
[post-release changes](../plans/spree-upgrade.md#post-release-upstream-changes-to-evaluate)
for evaluation; these do not widen the installed 6.0.0 contract.

## Evidence boundaries

Evidence has distinct scopes: source inspection, installed types, backend
responses, focused tests, browser integration and deployed operation. Do not
transfer a pass between scopes, releases, lockfiles or provider configurations.
A full app check against dependency edits is not a reproducible clean artifact.

The runtime baseline is the record for exact application/backend revisions,
fixture conditions and outcomes. Keep detailed test histories there rather
than repeating dated counts in architecture documents.

- Read-only catalog success does not certify payment or completion recovery.
- SDK balance completion does not certify the browser's application/removal UI.
- Browser Store Credit completion using a backend-applied fixture does not
  certify a storefront balance selector.
- Ordinary card success does not certify wallets, saved cards, ambiguous
  provider outcomes or lost-response OrderGroup recovery.
- Local compatibility does not certify staging, public cache behavior, jobs,
  storage, mail, webhooks, backups, rollback or live payment operation.

## Transport and ownership invariants

Use official SDK resource clients and generated types. Keep the stable SDK
exactly pinned; do not reproduce transport, retry or generated request types in
an internal package. Feature server boundaries normalize transport into
app-owned contracts before UI or query state receives it.

Validate resource identity, nested ownership, Market, currency and canonical
Channel before mapping, caching or credential persistence. Keep opaque IDs as
strings. Cart and Order projections must carry the configured Channel ID;
a publishable key by itself does not establish Channel ownership.

`SPREE_API_URL` is the SDK backend origin, such as `https://api.example.com`;
the Store client appends `/api/v3/store`. The app keeps its publishable key in
the server adapter even though Spree permits public clients to use such keys.
Customer credentials and privileged provider keys remain server-owned.

Market geography uses `country_codes`. Expanded countries must belong to that
set. URL/cookie locales remain lowercase; SDK requests restore canonical
regional casing such as `zh-CN` and `pt-BR`. Membership comes from the selected
Market, not a hardcoded app list.

Use SDK runtime code lists at transport boundaries. Keep components free of
SDK imports. Country and language labels use canonical codes with cached
`Intl.DisplayNames` in the reader's locale and locale-aware collation. Backend
Market/state labels remain merchant content; deprecated country-name fields
are not required by guards.

## Money and catalog contracts

Catalog money uses decimal `amount` and `compare_at_amount`, not
`amount_in_cents`. Authoritative arithmetic stays on Spree. App numeric
projections are for presentation, never payment decisions.

Catalog, Variant and cart unit prices retain up to four decimal places. Line
and purchase totals use the owning currency's precision, including
three-decimal currencies. Decimal strings pass directly to the app's SDK money
formatter where precision matters; hidden/null values remain unavailable,
while zero remains visible. Guards and mappers do not depend on `display_*`
fields. Receipt formatting uses the reader's locale and the parent commerce
resource's currency; customer credit uses the resolved request Market currency.

Price facets accept validated ordered, nonnegative decimal-string bounds.
Their existing finite-number compatibility is restricted to facets; it does
not relax Product or commerce money validation. Write money as decimal strings
through typed SDK params, and keep filter construction in the feature mapper.

Category `lft` sorting requires the backend initializer documented in
[storefront architecture](architecture.md#spree-integration).
A local TypeScript declaration does not enable a server sort. Verify native
move order and complete pagination after backend changes.

The integration backend has an application-owned database price-sort provider.
It resolves the serializer's featured offer and active pricing context, keeps
the authorized scope, orders before pagination and uses stable ties. This is
not a general upstream guarantee and does not change the Admin API or an
external search index. Resolving every matching product has a scaling cost;
an indexed equivalent needs separate implementation and evidence.

## Account and address contracts

Cart address writes use `CartAddressParams`; address-book writes use
`AddressCreateParams`. Send `country_code` and `state_code`, with required
create fields and SDK-backed country validation. App forms may retain
`countryIso` and `stateAbbr`; the owning mapper performs the conversion.
Wallet input rejects deprecated transport aliases instead of dropping them.

The Address response includes nullable `owner`. Account and checkout
projections consume their required fields and tolerate this additional data;
fixtures must match the installed SDK. Do not expose raw owner information
merely because an SDK response includes it.

Validate account-list filters and sorts against their resource's allowlist.
The SDK exposes typed Order filter/sort and physical-unit codes; this app does not
currently render/write physical units or use the new Order locale/currency/
country filters. Do not expose unused SDK fields as unvalidated UI inputs.

Request-start owner checks, token refresh, cookie persistence and cleanup are
owned by the existing account/cart/checkout features. Network, 5xx and generic
403 outcomes do not imply logout. Private server functions enforce their own
authentication and authorization regardless of route navigation.

## Checkout and completed-purchase recovery

Keep Spree authoritative for requirements, prices, quantity rules, delivery,
tax, payment and order results. Maintain the current lifecycle described in
[checkout architecture](checkout.md), including synchronous duplicate guards,
quote approval, owner-bound callbacks and isolated post-success UI effects.

Completed Carts are unavailable at Cart endpoints. Recover through the Order
contract; do not recreate an empty cart or pay again because a response was
lost. Any completion replay stays inside the verified 404/original-credential
conditions defined by the checkout owner.

`orders.get` can return an OrderGroup for a completed Cart handle or group ID.
Validate every child's identity, group number, Market, currency and Channel.
Use returned group totals/payments rather than rebuilding them from children;
retain nullable amounts. Guest reads require persisted child-order access and
matching group number/member IDs. Persist validated access under the original
owner before clearing the completed cart.

Fulfillment/payment labels use app message catalogs. Readable historical
aliases remain supported; unknown values fall back to human-readable words.
Review entry accepts fulfilled/delivered and historical shipped projections,
while the enabled review backend decides submission eligibility.

## Optional backend capabilities

Company-address lists and email-confirmed customer data requests are not
implemented storefront flows. Do not expose `company_id` without complete B2B
cart/company validation and inherited address-book ownership. A data-request UI
must handle email confirmation, `awaiting_confirmation` and `lapsed` before
claiming export/deletion completion.

Product and Category support storefront-visible `custom_fields` expansions in
6.0.0. Wider expansion on Seller, Address and other resources is post-release
upstream work; do not copy those fields from moving docs into pinned fixtures.

Reviews require their enabled backend extension and moderation contract. The
storefront's `SPREE_API_URL`, publishable key, and Channel must target the same
Store where `spree_reviews` is installed; enabling the storefront flag alone
does not install the extension. Check the product reviews, summary, and filters
Store API endpoints when the review section is unavailable. A 404 from those
endpoints can indicate a backend without the extension, an unpublished product,
or a different Store or Channel. Approved historical reviews may have an empty
title; new submissions still require one.
Quotes, digital fulfillment and post-sale screens need their own capability
plan, routes, permissions and tests. Storefront visibility is not implied by an
SDK method or an installed backend gem.

Spree Admin MCP is a separate backend capability. It does not belong in the
browser dependency graph, storefront credentials or this release's required
retail flow. Check the installed backend controller and authorization behavior
when configuring that service; a version-mismatched README is insufficient.

New order-placement integrations use the canonical `order.placed` event.
Classify existing compatibility listeners before removal and choose one
consumer-email owner before adding frontend webhook/email behavior.

## Upgrade and schema policy

Engine migrations and upgrade tasks run in the backend's controlled release
process, first on disposable data. Do not infer candidate migration steps from
an older release or assume schema rollback is safe.

The local commerce preflight checks pending migrations, required ownership
columns and the decimal precision/scale of the money columns listed in
`commerceMoneySchema`. Existing columns with older precision fail even when
their names match. Remote readiness is an explicit environment attestation,
not a local schema inspection.

A target change updates source target, runtime evidence, SDK/integrity when
needed, this guide, ledger, AGENTS, README and version-pinned workflow/preflight
consumers together. Keep source selection distinct from runtime verification;
the documentation guard pins the selected tuple but does not certify it.

Retain backend-owned customizations deliberately, re-run affected positive and
negative tests, and verify the deployed artifact against the actual backend.
Remaining work belongs in the release plan; architecture stays a description
of current contracts rather than an implementation diary.
