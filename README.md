# Spree TanStack Start Storefront

A single-storefront application built with TanStack Start, React, TypeScript,
Tailwind CSS v4, Base UI, Cloudflare Workers, and the Spree Store API.

## Scope

- Country- and locale-prefixed home, category, search, and product pages.
- Filters, sorting, pagination, seller attribution, and variant selection.
- Guest and customer cart, account, address, gift-card, and saved-card flows.
- Checkout with shipping, discounts, gift cards, Stripe, recovery, and order
  confirmation, including multi-seller OrderGroup responses.
- Optional reviews, newsletter, policy routes, metadata, structured data,
  sitemap, robots, and locale alternates.

The app connects to Spree through `@spree/sdk`. Spree remains the source of
truth for catalog publication, seller ownership, price, inventory, cart,
checkout, tax, shipping, payment, and orders.

## Compatibility baseline

The selected compatibility target is Spree `6.0.0` at revision
`661e226bd3b783b26f33f037748cc15a0f014c46` with exactly `@spree/sdk`
`6.0.0`. The [source target](config/spree-6-source-target.json) selects this
contract; the [runtime baseline](config/spree-runtime-baseline.json) records
local backend, commerce preflight, and read-only browser verification. Stripe
test-card completion currently returns `payment_failed`, and the complete
browser checkout gate remains open. Local evidence is not production
certification.

The [contract ledger](docs/plans/spree-upgrade.md) records the source audit,
installed SDK integrity and runtime gates separately.

## Prerequisites

- Node.js `22.13.0` or newer.
- `pnpm` `12.14.0`, as declared in [package.json](package.json). Align local and
  CI toolchains through P0 of the release plan before treating an installation
  or release build as reproducible.
- A compatible Spree v3 Store API deployment.

## Local setup

```bash
pnpm install
cp .env.example .env
```

The [environment template](.env.example) assumes Spree at
`http://localhost:3000` and the storefront at `http://localhost:3006`. Replace
`SPREE_PUBLISHABLE_KEY` with an active publishable key for your Spree Store,
and set `SPREE_API_URL` and `VITE_STOREFRONT_URL` for your environment. The
runtime defaults `SPREE_CHANNEL` to `online`; set it only when using a different
Channel, which must belong to that Store and already exist in Spree.

The development server uses port `3006` by default:

```bash
pnpm dev
```

Restart the development server after changing `.env`. Rebuild deployed assets
when changing `VITE_*` values.

## Environment boundary

These are all the application variables in [.env.example](.env.example):

| Variable                                         | Exposure | Example value                 | Purpose                                                                                                    |
| ------------------------------------------------ | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SPREE_API_URL`                                  | Server   | `http://localhost:3000`       | Required Spree backend origin used by the Store SDK                                                        |
| `SPREE_PUBLISHABLE_KEY`                          | Server   | `pk_your_publishable_api_key` | Required Store-scoped publishable key; replace the placeholder                                             |
| `SPREE_CHANNEL`                                  | Server   | `online`                      | Channel code or prefixed ID; runtime fallback is `online`, but production builds require an explicit value |
| `VITE_STOREFRONT_URL`                            | Browser  | `http://localhost:3006`       | Public origin for links, metadata, and payment redirects; required for production                          |
| `VITE_STOREFRONT_NAME`                           | Browser  | `Shop`                        | Optional fallback Store name while backend branding is unavailable                                         |
| `VITE_STRIPE_PUBLISHABLE_KEY`                    | Browser  | Empty                         | Required for Stripe payment UI; may stay empty for catalog development                                     |
| `VITE_STOREFRONT_REVIEWS_ENABLED`                | Browser  | `false`                       | Reviews are disabled by default; set `true` only with a compatible backend extension                       |
| `VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT` | Browser  | Empty                         | Optional currency map for the cart free-shipping progress indicator                                        |

For the free-shipping indicator, use an explicit currency map with positive
amounts in each currency's major units:

```env
VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT=USD=100,EUR=95
```

The indicator uses the cart item total and reaches its target only when that
total exceeds the configured amount. An empty value or a currency absent from
the map hides the indicator. Configure matching free-shipping rules in Spree;
this variable only controls storefront messaging.

Stripe checkout needs a publishable key for the backend's Stripe account; use
a `pk_test_` key for checkout tests. Enabling reviews also requires the backend
review and moderation contract described in the
[Spree guide](docs/guides/spree.md#optional-backend-capabilities).

`VITE_*` values are compiled into the browser bundle. Never place customer,
refresh, cart, order, provider, or payment secrets in them. Keep `.env` files,
private URLs, account names, and local filesystem paths out of version control.
The `pnpm deploy` build enables strict production validation and requires HTTPS
for both `SPREE_API_URL` and `VITE_STOREFRONT_URL`; `pnpm build` alone does not
enable that release-specific validation. Deployment configuration is covered in the
[release guide](docs/guides/testing-and-release.md#configuration).

### Cloudflare Workers deployment

`pnpm deploy` needs the production build values in the build environment. Put
the required `SPREE_API_URL`, `SPREE_PUBLISHABLE_KEY`, `SPREE_CHANNEL`, and
`VITE_STOREFRONT_URL` values in an untracked `.env.production.local` file or
provide them through the deployment environment. Add any optional `VITE_*`
settings there too. The production build requires an explicit `SPREE_CHANNEL`,
even though the Worker runtime defaults it to `online` when no runtime binding
is set. Changing a `VITE_*` value requires rebuilding and redeploying because
it is compiled into the browser bundle.

The deployed Worker needs `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` at
runtime. Configure them as Wrangler secrets with values matching the production
build environment. Wrangler prompts for each value:

```bash
pnpm exec wrangler secret put SPREE_API_URL
pnpm exec wrangler secret put SPREE_PUBLISHABLE_KEY
```

Cloudflare documents [Worker variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
and [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

Set a runtime `SPREE_CHANNEL` binding only when the store uses a Channel other
than `online`; keep it consistent with the production build value. When a
`SPREE_*` value changes, update the production build environment and matching
Worker binding, then run `pnpm deploy` to publish the matching build.
`wrangler secret put` also deploys a Worker version immediately. Rebuild and
redeploy after changing any `VITE_*` value as well.

Configure a local Rails integration app without committing its location:

```bash
E2E_SPREE_DEMO_PATH=/path/to/local/spree-demo pnpm verify:spree-runtime
```

Remote test environments attest their version through
`E2E_SPREE_BACKEND_VERSION` and optional `E2E_SPREE_BACKEND_REVISION`.
These integration settings are separate from the application template; see
[browser evidence](docs/guides/testing-and-release.md#browser-evidence) for
checkout readiness and Playwright server configuration.

## Build and validation

```bash
pnpm build
pnpm validate
```

Focused commands:

```bash
pnpm check
pnpm check:docs
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:spree-runtime
pnpm verify:spree-commerce-runtime
pnpm test:e2e:read-only
pnpm test:e2e
pnpm test:e2e:checkout
```

## Architecture

Request flow:

```text
route or component
  -> feature-owned query or server function
  -> Channel-bound @spree/sdk request
  -> runtime identity and ownership guard
  -> feature mapper
  -> normalized contract
  -> query cache or UI
```

Feature code lives in `src/lib/<feature>`. Pure contracts and selectors live in
`src/lib/core`, Spree integration and shared transport guards live in
`src/lib/runtime`, and accessible business-free UI primitives live in
`src/components/ui`.

Customer, refresh, cart, order, and payment credentials stay behind server-only
boundaries and httpOnly cookies, except provider-scoped client secrets required
by the [checkout payment UI](docs/guides/checkout.md#payment).
HTML, server functions, account, cart, and
checkout are never publicly cacheable.

## Documentation

Start with [docs/README.md](docs/README.md). Repository-wide contributor and
agent rules live in [AGENTS.md](AGENTS.md). Open release gates live in
[the production-readiness plan](docs/plans/release.md).
It owns execution order and links the detailed catalog, SEO and contract plans.

Committed documentation is English and contains no personal paths, private
hostnames, credentials, customer information, or internal deployment topology.
