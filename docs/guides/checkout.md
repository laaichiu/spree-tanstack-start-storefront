# Checkout

## Scope

Cart and checkout are feature-owned parts of the storefront. Pure helpers and
accessible UI primitives stay in app-owned modules. Spree remains responsible
for all commerce decisions and completion contracts.

Spree is authoritative for line items, prices, discounts, gift cards, tax,
shipping, payment state, completion, and order identity. The storefront never
recalculates authoritative totals or advances an order with browser policy.

A generic `403 Forbidden` is an authorization failure, not evidence that the
customer session expired. Preserve authentication cookies and propagate that
failure. Refresh and cleanup are limited to `401 Unauthorized` or an explicit
invalid-refresh-token outcome, while retaining request-owner checks.

## Request path

```text
component
  -> feature controller or mutation hook
  -> feature-owned server function
  -> session and market preflight
  -> Channel-bound @spree/sdk request
  -> response ownership guard
  -> normalized mapper
  -> owner-guarded persistence
  -> query projection and UI callback
```

Routes and components do not import `@spree/sdk` or read commerce cookies.

Spree 6 derives `requirements[]` on each Cart read; completion adds stock,
quantity and guest-policy checks. An empty array is not a completion guarantee.
The current app projection retains `step`, `field` and `message`, but omits the
backend `code`. Preserving codes and presenting unknown extension requirements
is remaining release work; a mapper's existence does not establish that coverage.

## Session ownership

Cart and checkout requests capture the request-start cart ID and token. Backend
responses may rotate the token; use the newest response token for subsequent
calls inside that request, but compare persistence and cleanup against the
request-start cookie owner.

A late response may not overwrite or clear a newer cart session. Owner mismatch
fails closed before cache writes or caller success. Completed-order guest access
follows the same rule for order aliases and access tokens.

Customer authentication refresh is owned by the Account session boundary.
Checkout passes the market-specific client and current credentials into that
boundary; it does not implement a second refresh path. Network and server
failures do not clear authentication.

## Response guards

Before mapping or persistence:

- Cart endpoints must return a non-empty `cart_…` resource matching the
  requested Cart when the request is cart-specific.
- Order fallback must return an `or_…` Order resource and a completed state.
- Multi-seller completion may return an `ogrp_…` OrderGroup from the
  requested Cart's completion call. The group must be completed. Its completed
  child Orders have `cart_id: null` after Spree splits the Cart; their
  group-numbered references, Market, currency, and configured Channel must
  match the group.
- Cart and Order must match the resolved Market, currency, and configured
  Channel.
- Nested line items, fulfillments, rates, addresses, payments, and adjustments
  must belong to the returned Cart or Order.
- PaymentSession resources must use `ps_…`, match the requested session or
  allowed provider external ID, match currency and payment method, and expose
  only the safe provider fields required by the browser.
- Non-card PaymentSource resources use `psrc_…`. Payment projections in Cart,
  checkout, and account order details require `source_id` to match the nested
  source ID; an absent source requires an explicit null ID and type.
- Direct payment responses must be valid Payment resources matching the
  selected payment method.

Malformed or mixed-owner responses fail before cookie or query mutation.

## Mutation serialization

Writes are serialized by an explicit scope that includes the current Market and
Cart owner. Reactive pending state protects the UI, while a synchronous query
or mutation-cache check prevents same-tick cross-observer duplicates.

Use operation-specific keys for line-item changes, address persistence,
shipping-rate selection, discount/gift-card changes, payment preparation, and
session reset. A duplicate no-op is not a successful reset and must not clear
checkout projections.

Cancel relevant in-flight Cart and Checkout reads before a state-changing
mutation so an older read cannot overwrite the mutation result.

## Address and shipping

Spree owns address validation effects, available fulfillment methods, shipping
rates, tax, and totals. Address save and rate selection must verify the returned
Cart, persist any rotated token under the original owner snapshot, and then
refresh normalized checkout state.

Address writes on customer-owned carts include the current customer session
through the Account refresh boundary. Guest carts use only their cart token. If
customer authentication fails, do not retry the address write as a guest.

A complete address with no available delivery quote displays an unavailable
message, distinct from the prompt for an incomplete address. Pending address
and delivery operations take precedence over that empty result.

Automatic shipping-rate selection and submit-time preparation share stable
mutation callbacks and lifecycle guards. Rerenders, unmounts, Cart changes, and
Market changes invalidate stale effects without canceling legitimate in-flight
work owned by the same generation.

## Discounts and gift cards

Apply and remove actions are distinct serialized operations. A discount failure
may fall back to the gift-card path only for the known validation outcome that
means “not a discount code”; identity, ownership, or malformed-response errors
must continue to fail closed.

The response Cart must pass the same ownership and persistence rules as every
other checkout mutation.

## Payment

Payment preparation revalidates Cart identity, Market, Channel, current
shipping state, and authenticated customer ownership when saved cards are used.
Only a successful provider terminal state may advance to order completion.
Pending, processing, expired, failed, canceled, malformed, or unknown provider
states fail closed or enter the documented recovery path.

Receipt amounts use their owning Cart or Order currency and the reader's current
locale. Payment and fulfillment status labels use the app message catalogs.
Validate the canonical decimal amount before
formatting; do not require deprecated `display_*` fields or treat hidden money
as zero. Formatting context must be passed explicitly through completion and
recovery so a stored checkout locale cannot replace the current reader locale.

The optional express-wallet integration loads through a checkout-owned dynamic
boundary only for an eligible Cart. Its loading or retryable chunk error does
not block the regular checkout fields. Late module results are ignored after
the boundary unmounts or the Cart becomes ineligible; the loaded flow receives
the current Cart and retains its own owner guards.

Resetting an unnecessary or unsupported payment session settles once per
checkout context. Owner changes and explicit retries still invalidate prior
work; a reset must not retrigger itself through its generation-bound callbacks.

Stripe client secrets may be passed to Stripe.js as required by the provider,
but must not be logged, cached publicly, placed in analytics, or exposed in a
general app contract. The checkout-owned payment-session projection allowlists
`external_data.client_secret`; privileged gateway keys remain server-only.
Provider callbacks are contained so a UI callback failure
cannot turn a completed payment or order into a failed mutation.

## Completion and recovery

Completion first validates and normalizes the returned resource, then persists
completed-order access, and only then clears the active Cart if the request
still owns it. Recovery queries the Order contract, which may return an OrderGroup, when the completed Cart is
no longer available. For a completed multi-seller Cart, a failed Order lookup
may replay Spree's idempotent Cart completion only when the original Cart
credential exists and a Cart read confirms that it is no longer available
(404). A readable Cart or transient network error must not trigger replay.

When Spree completes a multi-seller Cart as an OrderGroup, the storefront
persists the group reference, group number, child Order IDs, and guest access
token in httpOnly cookies. The order-placed route accepts the `ogrp_…` resource
ID and reads the complete purchase from `orders.get`. The returned group number
and child IDs must match the persisted access record. It maps the group's
authoritative totals and payments, validates every child Order, and does not
trust a group reference without the corresponding child-order access record.

Mixed customer/cart credentials may require a documented guest-token-only
fallback. The fallback preserves the original safe error if the lookup fails
and never maps or persists an incomplete Order.

Success navigation uses the normalized completion result. Background cart
invalidation, navigation, or analytics failures are contained after completion
and cannot request another payment or completion attempt.

## Required evidence

- Runtime and commerce preflight for the selected backend.
- Unit tests for state predicates, identity, and ownership guards.
- Server tests for cookie ownership, token rotation, and error recovery.
- Client tests for duplicate prevention, stale callbacks, and pending state.
- Browser scenarios for guest and authenticated checkout, address changes,
  shipping, codes, saved cards, provider success/decline/retry, recovery, and
  order completion.
- Separate deployed evidence for webhooks, jobs, storage, rollback, and live
  payment operations.
