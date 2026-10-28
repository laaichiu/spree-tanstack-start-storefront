# Testing and release

## Commands

| Scope                              | Command                              |
| ---------------------------------- | ------------------------------------ |
| Repository formatting              | `pnpm check`                         |
| Documentation integrity            | `pnpm check:docs`                    |
| Full application gate              | `pnpm validate`                      |
| Unit and component tests           | `pnpm test`                          |
| Public read-only browser suite     | `pnpm test:e2e:read-only`            |
| Full browser suite                 | `pnpm test:e2e`                      |
| Checkout browser suite             | `pnpm test:e2e:checkout`             |
| Required remote commerce fixtures  | `pnpm test:e2e:checkout:release`     |
| Runtime compatibility preflight    | `pnpm verify:spree-runtime`          |
| Commerce schema/provider preflight | `pnpm verify:spree-commerce-runtime` |

Use focused checks while iterating, then run `pnpm validate` for a complete
application change.

## Ownership

- Core tests protect pure contracts, selectors, and validation.
- Runtime tests protect SDK integration, Channel ownership, and transport
  guards.
- UI primitive tests protect ARIA, keyboard operation, focus, and variants.
- Feature tests protect mappers, sessions, queries, controllers, and views.
- Browser tests protect observable route and commerce behavior.

Keep tests beside the feature and contract they protect. Vitest uses Node for
`.test.ts` and jsdom for `.test.tsx`; DOM hook tests written without JSX explicitly
select jsdom with a file directive. Preserve per-file isolation.

The build budget checks named artifacts plus the browser entry's complete static
JavaScript import graph from Vite's manifest, deduplicating shared chunks.
Performance sampling uses the installed Playwright API; install Chromium with
`pnpm exec playwright install chromium` before running `pnpm measure:performance`.
Browser navigation and Store API probes have bounded timeouts. The explicit
post-navigation sampling window is intentional and differs from E2E readiness.

## Test shape

### Pure logic and guards

Use `.test.ts` for non-React logic. Cover canonical input, malformed input,
wrong resource type, wrong requested identity, owner mismatch, nullability, and
boundary values.

### Components and hooks

Use `.test.tsx` only for JSX, DOM, hooks, or React interaction. Prefer
observable behavior, accessible names, focus, callbacks, and rendered states.
Assert Tailwind classes only when a class is the actual responsive, focus,
scroll, or overlay contract being protected.

### Server functions and sessions

Cover authentication, Market and Channel ownership, request-start cookie
ownership, token rotation, stale responses, retry budgets, safe errors, and
cleanup. Network and 5xx errors must not be treated as logout.

### Mappers

Use realistic transport fixtures and validate every nested shape the mapper
reads. Include malformed and mixed-owner fixtures. A mapper test should prove
that raw provider or SDK data cannot leak into UI contracts.

## Browser evidence

The read-only suite may run against an attested remote backend. Checkout tests
require the commerce preflight, disposable test data, and test-mode payment
configuration.

Export integration variables in the shell that runs the checks. The runtime
version preflight reads `E2E_*` from the process environment, not `.env`.
For a local Rails application:

```bash
export E2E_SPREE_DEMO_PATH=/path/to/local/spree-demo
pnpm verify:spree-runtime
```

For a remote environment, provide:

```bash
export E2E_SPREE_BACKEND_VERSION=6.0.0
export E2E_SPREE_BACKEND_REVISION=661e226bd3b783b26f33f037748cc15a0f014c46
pnpm verify:spree-runtime --require-revision
```

Release automation must use `pnpm verify:spree-runtime --require-revision` to
require the exact selected revision; an ad hoc remote read-only check may omit
the revision and flag. Remote attestation takes precedence over a local path;
unset the remote version/revision variables before checking a local backend.
The preflight compares the installed SDK and a local lockfile or operator
attestation. It does not probe the Worker-to-backend connection or inspect a
remote schema, so attest only an independently verified deployment.
Remote checkout evidence additionally
requires `E2E_SPREE_COMMERCE_READY=true`, a Stripe test publishable key, and a
backend whose data may safely be mutated. Group scenarios require
`E2E_ORDER_GROUP_FIXTURE_READY=true` without a local Rails app; set it only when the expected first-party
and seller products, stock, delivery methods, and test payment configuration
have been provisioned in that environment.

Remote checkout is a subset of the suite: authenticated fixture scenarios and
some code/balance scenarios skip without `E2E_SPREE_DEMO_PATH`. The group flag
attests existing fixtures and does not create them. Review skipped tests against
the release capability list; a passing remote command does not certify the
complete local fixture matrix.

There is no implicit local Rails path. Local fixture provisioning and commerce
preflight fail closed unless `E2E_SPREE_DEMO_PATH` is explicitly set to an
absolute path.

The Playwright-managed Vite server enables `CLOUDFLARE_INCLUDE_PROCESS_ENV=true`
so explicit `SPREE_API_URL` and other server variables reach the local Worker
and override `.env` values. A separately started server used through
`PLAYWRIGHT_BASE_URL` must use the same setting. Confirm requests reach the
intended backend before running checkout: version preflight alone does not
prove which backend the storefront Worker uses.

### Commerce target verification

Every checkout Playwright project depends on `commerce-setup`, including direct
CLI runs. Setup checks the dependency tuple and schema/provider preflight, then
challenges the tested Worker before any write scenario runs. Never use
`--no-deps` for commerce evidence.

Set these process variables explicitly for disposable commerce runs:

```bash
export E2E_COMMERCE_DISPOSABLE=true
export E2E_COMMERCE_TARGET_URL=http://127.0.0.1:3102
export E2E_COMMERCE_PROBE_KEY=replace-with-a-random-shared-secret
```

Use the actual storefront origin for `E2E_COMMERCE_TARGET_URL`; it must match
Playwright's base URL exactly. Remote targets require HTTPS. Configure the same
probe secret and `E2E_COMMERCE_DISPOSABLE=true` on the disposable Worker's server
bindings. The deployed storefront must be built with a Stripe `pk_test_` key.
Managed local Vite receives these values through its explicit process environment.

The private challenge endpoint returns only a nonce-bound HMAC over the runtime
API URL, Channel, Spree publishable key and built Stripe test key. An unauthenticated,
disabled, or non-test-payment probe returns 404. It does not return configuration
or credentials. A mismatched tuple, redirect, timeout, or absent confirmation
blocks the suite. This verifies the Worker's configured target, not a remote
backend's schema or source revision; those still require independent attestation.
Never configure the commerce probe secret or disposable flag on production.

The release commerce command additionally requires remote OrderGroup fixture
readiness. Local-only saved-card and coupon fixtures remain a separate coverage
requirement: the remote subset cannot certify them. Every run emits
`test-results/coverage.json` with outcomes and skipped titles; inspect the skips
against enabled release capabilities. It contains no response bodies or errors.
Traces and screenshots stay local; release workflows upload only this coverage
metadata, not commerce session credentials.

The Vite dev server excludes browser output, Playwright reports, and CLI
artifacts from file watching. Trace HTML snapshots must not trigger a reload
of the checkout being tested.

Never commit the local path, publishable key, provider key, customer account,
or generated test data.

Browser coverage should include:

- localized routing and Market switching;
- home, listing, search, product, policy, and account boundaries;
- keyboard and accessibility behavior;
- security and cache headers;
- responsive layout and overflow;
- cart mutation and session recovery;
- checkout addresses, shipping, codes, saved cards, payment outcomes, recovery,
  and single-order and OrderGroup completion.

## Evidence levels

Use precise labels:

- `audited`: source and contract inspected;
- `implemented`: code and focused tests exist;
- `verified-local`: local runtime and relevant browser evidence pass;
- `verified-staging`: deployed staging evidence passes;
- `verified-production`: approved production evidence passes.

Do not promote local evidence to staging or production. Jobs, mail, storage,
webhooks, backup/restore, rollback, and live payment operations need separate
evidence.

## Fixture safety

- Keep fixtures synthetic and free of personal information.
- Use provider test-mode values only.
- Checkout browser tests create carts and orders and consume or reserve
  inventory. Run them against an isolated disposable database, with enough
  stock and seller-compatible delivery methods for the selected fixtures.
  Never use a development database whose data must be preserved.
- Do not copy backend dumps into the storefront repository.
- Keep resource IDs realistic but invented unless a test explicitly creates
  and destroys its own backend records.
- Record version and capability metadata, not private environment topology.

## Deployment

### Deployment boundary

The application builds one Cloudflare Worker and connects to a Spree Store API.
The Worker owns its domain, public origin, Channel, cookies, cache, release, and
rollback. A frontend release does not migrate or release the Rails backend.

This runbook does not replace backend migration, jobs, mail, payment webhook,
object storage, backup, or restore procedures.

### Configuration

Each deployment supplies:

```env
SPREE_API_URL=https://api.example.com
SPREE_PUBLISHABLE_KEY=pk_your_publishable_api_key
SPREE_CHANNEL=channel-code-or-id
VITE_STOREFRONT_URL=https://store.example.com
```

Use the complete application-variable inventory and optional capability settings
in the [README](../../README.md#environment-boundary) and [.env.example](../../.env.example).
Supply `VITE_*` values at build time. Supply `SPREE_API_URL` and
`SPREE_PUBLISHABLE_KEY` to the deployed Worker's environment bindings or
secrets, and provide them plus an explicit `SPREE_CHANNEL` to production build
validation. The Worker runtime defaults `SPREE_CHANNEL` to `online`; configure a
runtime binding only when deploying to a different Channel. Local `.env` files
and build-shell variables do not provision deployed bindings.
See [Cloudflare environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
and [local development variables](https://developers.cloudflare.com/workers/local-development/environment-variables/).

`VITE_*` values enter the browser bundle. `SPREE_*` values stay server-side.
Never place customer/cart/order access credentials, refresh tokens or privileged
gateway keys in client variables, logs, analytics or committed environment files.
The checkout-owned Stripe.js client-secret projection is the narrow exception
described in [Payment](checkout.md#payment); gateway secrets remain server-only.

`pnpm deploy` enables `STOREFRONT_DEPLOY_ENV=production` for strict build checks,
including explicit Channel/key configuration and HTTPS API/public origins.
`pnpm build` alone does not enable that release-specific validation.

The runtime resolves `SPREE_CHANNEL` through the official SDK, defaulting to
`online` when the Worker binding is absent. Cart and Order responses with
missing or different canonical Channel ownership fail before mapping,
persistence, or caching.

Use an absolute `E2E_SPREE_DEMO_PATH` for local integration. Do not commit a
contributor's backend directory or private hostnames.

Category navigation requires the backend's native `lft` sorting configuration
described in [Storefront architecture](architecture.md#spree-integration).
Apply it and restart Rails before releasing the Worker. Verify the selected
backend's actual ordering; an HTTP 200 alone does not prove that it applied an
unallowlisted sort. Confirm that a category moved in the dashboard retains its
new position in the storefront after refreshing the page.

### GitHub environment setup

`ci.yml` runs the frozen install, production dependency audit and `pnpm validate`
on pushes and pull requests, using neutral build values without backend writes.
The three release workflows are manual and use GitHub environments `production`,
`staging`, and `staging-commerce`. Configure environment protections and reviewers
in GitHub before allowing releases.

Each environment supplies variables `SPREE_API_URL`, `SPREE_CHANNEL`,
`VITE_STOREFRONT_URL`, optional `VITE_STOREFRONT_NAME`, and
`VITE_STRIPE_PUBLISHABLE_KEY`, plus secret `SPREE_PUBLISHABLE_KEY`. Production
also needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. Provision
`SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` as server bindings separately;
configure a runtime `SPREE_CHANNEL` binding only when using a non-`online`
Channel. Build-shell values do not configure a deployed Worker.

The commerce environment additionally supplies secret `E2E_COMMERCE_PROBE_KEY`
and variables `E2E_SPREE_COMMERCE_READY=true` and
`E2E_ORDER_GROUP_FIXTURE_READY=true` only after independently verifying them.
Its manual dispatch requires disposable-backend confirmation. Input version and
revision are operator attestations; defaults alone do not prove a deployment.
Production post-deploy checks and staging smoke run only the read-only suite.

### Pre-release gates

The release checkout must provide executable CI, production deploy, read-only
staging and disposable-commerce staging workflows. The documentation checker parses the workflow YAML and checks executable gate order,
manual release triggers, environment bindings, permissions and disposable-commerce
confirmation. It requires `deploy-storefront.yml`, `staging-storefront-smoke.yml` and
`staging-storefront-commerce.yml` under `.github/workflows`; their execution must be verified before release. CI must run production dependency
auditing and application validation on pushes and pull requests. A green CI run
does not attest a deployed backend or environment.

1. Identify the target environment, domain, Channel, backend version, migration
   state, release owner, and rollback owner outside the repository.
2. Run `pnpm validate` for the full application gate.
3. Run `pnpm verify:spree-runtime` against the intended backend.
4. For checkout evidence, run `pnpm verify:spree-commerce-runtime` in a test
   environment and use only provider test-mode configuration.
5. Confirm the Channel exposes only intended products, prices, Markets,
   shipping methods, and payment methods.
6. Confirm every published Market has explicit country assignments.
7. Verify backend jobs, mail, cache, object storage, webhooks, health checks,
   backup, and restore separately from the Worker artifact.
8. Confirm the migration-ledger and production-readiness gates are not
   `unknown` for the release surface.

Read-only staging automation must never create commerce data. Separate
staging commerce automation must require explicit disposable-backend confirmation,
test-mode Stripe configuration, exact backend version and revision, and
confirmed first-party and seller fixtures for multi-seller OrderGroup checkout.
It creates orders and can reserve or consume inventory. It must fail
before running tests if OrderGroup fixture readiness is not confirmed.

### Deploy

```bash
pnpm deploy
```

Deployment does not migrate Rails, configure webhooks, or release the backend.
Production automation must run only read-only post-deploy browser checks. Run
write-path checks against approved disposable staging data before promotion;
never point it at production or a development database whose data must be kept.

### Post-deploy smoke

- Localized home, listing, search, product, policy, cart, account, and checkout
  boundaries.
- Market switching, canonical URLs, alternates, robots, and sitemap.
- Cart ownership, totals, shipping, code and gift-card behavior, payment
  recovery, and completion in an approved test environment.
- CSP, security headers, private cache rules, error handling, and observability.
- Responsive layout, keyboard focus, and critical image behavior.

### Rollback

1. Stop promotion and record the release identifier in the deployment system,
   not this repository.
2. Roll back the Worker unless evidence shows a backend contract mismatch.
3. If the backend changed, follow the backend migration and data rollback
   procedure before restoring traffic.
4. Repeat security, routing, session, and commerce smoke checks after rollback.
5. Never reuse credentials or customer data from a failed environment as test
   fixtures.

### Evidence handling

Commit reusable commands, generic runbooks, and public contract versions.
Store deployment URLs, account names, credentials, customer data, internal
topology, and incident details in the approved private operations system.
