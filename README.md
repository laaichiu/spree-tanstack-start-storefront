# Spree TanStack Start Storefront

A headless ecommerce storefront for [Spree Commerce](https://spreecommerce.org), built with TanStack Start, React, TypeScript, Tailwind CSS v4, Base UI, and the [Spree Store API](https://spreecommerce.org/docs/api-reference/store-api/introduction).

The project is a single, feature-oriented reference storefront. Its deployment target is [Cloudflare Workers](https://workers.cloudflare.com/) through Vite and Wrangler.

## Features

- Country- and locale-prefixed storefront routes such as `/$country/$locale`.
- Home, collection, product listing, search, filtering, sorting, and pagination.
- Product detail pages with media, variants, availability, related products, and optional reviews.
- Cart page and cart drawer with quantity, removal, promotion, and gift-card flows.
- Single-page checkout for address, shipping, payment, completion, and payment recovery.
- Stripe Payment Element, saved cards, and express checkout when the corresponding Spree payment method and public key are configured.
- Customer authentication, profile, addresses, saved cards, gift cards, order history, and order detail.
- Store policy pages, newsletter subscription, localized UI messages, and market switching.
- SEO foundations including canonical URLs, Open Graph metadata, JSON-LD, robots, sitemap, and market/locale alternates.

Product reviews are optional and require the `spree_reviews` backend extension. The feature is disabled unless `VITE_STOREFRONT_REVIEWS_ENABLED=true` is set at build time.

## Technology

- [TanStack Start](https://tanstack.com/start), TanStack Router, and TanStack Query
- React 19 and TypeScript
- [@spree/sdk](https://www.npmjs.com/package/@spree/sdk)
- Tailwind CSS v4 and project semantic tokens
- [Base UI](https://base-ui.com/) primitives wrapped by `src/components/ui`
- Vite, [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/), and Wrangler

## Prerequisites

- Node.js `22.13.0` or later
- pnpm `11.1.2` (the repository pins this through `packageManager`)
- A Spree backend with Store API access

The storefront and the backend are separate deployables. Before a production release, confirm that the Rails backend, Spree extensions, payment configuration, database migrations, worker processes, webhooks, shared cache, and object storage are compatible with the storefront release.

## Local setup

Install dependencies and create the local environment file:

```bash
pnpm install
cp .env.example .env
```

Set the local Spree API URL and publishable key in `.env`. The `pnpm dev` script uses port `3006`, so set `VITE_STOREFRONT_URL=http://localhost:3006` for local development.

### Environment variables

| Variable                                         | Scope                               | Required        | Description                                                                                                               |
| ------------------------------------------------ | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `SPREE_API_URL`                                  | Build validation and Worker runtime | Yes             | Spree Store API URL. Production builds require HTTPS.                                                                     |
| `SPREE_PUBLISHABLE_KEY`                          | Build validation and Worker runtime | Yes             | Spree publishable key beginning with `pk_`.                                                                               |
| `VITE_STOREFRONT_URL`                            | Build time and browser bundle       | Production      | Public origin used for canonical URLs, social metadata, sitemap, and payment return URLs.                                 |
| `VITE_STOREFRONT_NAME`                           | Build time and browser bundle       | No              | Public store name used until Spree exposes a public Store branding resource.                                              |
| `VITE_STRIPE_PUBLISHABLE_KEY`                    | Build time and browser bundle       | If using Stripe | Stripe publishable key. Never use a Stripe secret key here.                                                               |
| `VITE_STOREFRONT_REVIEWS_ENABLED`                | Build time and browser bundle       | No              | Set to `true` to enable the optional reviews feature.                                                                     |
| `VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT` | Build time and browser bundle       | No              | Optional announcement/progress threshold, for example `USD=100,EUR=95`. Spree still determines the actual shipping total. |

The reference storefront currently uses the local `/spree.png` asset for its logo. Do not add a logo environment
variable; a future public Spree branding API can replace this asset through the normalized branding contract.

`VITE_*` values are baked into the client bundle during the Vite build. They are not runtime Worker configuration. Do not put customer, cart, order, refresh, or payment secret tokens in any `VITE_*` variable. Keep `.env` and other local environment files out of version control.

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3006](http://localhost:3006). The root route resolves the market and redirects to a localized path such as `/us/en`.

Build and preview locally with:

```bash
pnpm build
pnpm preview
```

## Quality checks

Run the complete non-browser validation suite with:

```bash
pnpm validate
```

Individual checks are also available:

```bash
pnpm check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:checkout
pnpm build
```

Vitest covers mappers, normalized contracts, cookies, market resolution, cart helpers, checkout/payment readiness, and other business logic. Playwright covers the shopping and checkout path against a compatible Spree backend.

## Architecture

The application keeps Spree access on the server and maps external responses before they reach the UI:

```text
Browser
  -> TanStack route and loader
  -> feature server function / use case
  -> @spree/sdk
  -> Spree Store API
  -> feature mapper
  -> normalized storefront model
  -> route/component/query cache
```

Key boundaries:

- Routes handle URL state, loaders, redirects, SEO, boundaries, and page composition.
- React components do not fetch Spree directly and do not import `@spree/sdk` or `src/lib/spree`.
- Raw Spree responses are normalized by feature-owned mappers before entering UI or query caches.
- Cart, checkout, payment, price, tax, shipping, promotion, and inventory remain owned by Spree.
- Sensitive mutations use TanStack Start server functions and httpOnly cookie sessions.
- `src/components/ui` contains business-free Base UI wrappers; feature UI lives under `src/components/<feature>`.
- Global styles enter through `src/styles/globals.css`; brand values and layout primitives use semantic tokens.

## Deploy to Cloudflare Workers

The committed [`wrangler.jsonc`](wrangler.jsonc) configures the Worker name as `spree-tanstack-start-storefront`, the compatibility date, Node.js compatibility, and the TanStack Start server entry. The `pnpm deploy` script runs a strict production build, checks the build budget, and then runs `wrangler deploy`.

### 1. Authenticate Wrangler

```bash
pnpm exec wrangler login
pnpm exec wrangler whoami
```

For CI, use a Cloudflare API token or the deployment integration provided by the CI platform instead of an interactive login.

### 2. Prepare production build values

The production build must receive these values before `pnpm deploy` runs:

```env
SPREE_API_URL=https://api.example.com
SPREE_PUBLISHABLE_KEY=pk_live_...
VITE_STOREFRONT_URL=https://shop.example.com
VITE_STOREFRONT_NAME=Shop
```

Add these optional values when the corresponding features are enabled:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STOREFRONT_REVIEWS_ENABLED=true
VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT=USD=100
```

Use an ignored `.env.production.local` file for a local release, or inject these values through the CI secret/environment store. `VITE_STOREFRONT_URL` must be a bare HTTPS origin with no path, query, or hash. The production build fails if the storefront origin or Spree API is missing or not HTTPS, or if a publishable key is malformed.

`SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` are required during the production build because the repository validates them before producing the artifact. Cloudflare Worker secrets are runtime configuration and are not automatically available to a build running on your laptop or in CI.

### 3. Configure Worker secrets

Configure the same server-side values as Wrangler secrets for the deployed Worker:

```bash
pnpm exec wrangler secret put SPREE_API_URL
pnpm exec wrangler secret put SPREE_PUBLISHABLE_KEY
```

Do not commit these values to `wrangler.jsonc`, `README.md`, or any `.env.example` file. Do not configure `VITE_*` values only as Worker secrets or dashboard variables after the build; update the build environment and redeploy when they change.

### 4. Validate and deploy

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm deploy
```

`pnpm deploy` sets `STOREFRONT_DEPLOY_ENV=production`, runs the production build and budget check, then deploys the Worker. It does not deploy the Rails backend, run database migrations, configure Stripe webhooks, or provision backend infrastructure.

### 5. Verify and roll back

After deployment, run post-deploy checks for localized home/catalog/PDP routes, canonical and sitemap URLs, security headers, private session caching, cart/session behavior, and a safe non-charging smoke path.

List deployments and roll back to a known-good Worker version when the incident is isolated to the storefront artifact:

```bash
pnpm exec wrangler deployments list --name spree-tanstack-start-storefront
pnpm exec wrangler rollback <known-good-version-id> \
  --name spree-tanstack-start-storefront \
  --message "rollback storefront release" \
  --yes
```

Do not use a Worker rollback to hide an incompatible backend API contract or an irreversible database migration. For those incidents, coordinate storefront and backend rollback or recovery together.

## Project structure

```text
src/routes                 URL state, loaders, redirects, SEO, page composition
src/components/ui          Business-free Base UI wrappers
src/components/<feature>   Storefront UI grouped by feature
src/lib/<feature>/api      SDK access and TanStack server functions
src/lib/<feature>/mappers  Raw Spree response normalization
src/lib/<feature>/model    Stable UI-facing contracts
src/lib/<feature>/utils    Feature-specific pure logic
src/lib/spree              SDK initialization and server-only boundary
src/lib/env|cookies|money  Shared environment, session, and money helpers
src/styles                 Tokens, themes, utilities, and global stylesheet entry
e2e                        Playwright shopping, checkout, and SEO flows
```

Checkout is grouped by change reason (`address`, `shipping`, `payment`, `express`, `summary`, `completion`, and `code`) so high-risk lifecycle code and tests stay close to their owners.

## License

[MIT](LICENSE.md)
