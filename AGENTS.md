# Repository instructions

This file contains current, durable rules only. Do not append implementation
logs, completed-task summaries, test counts, commit hashes, or dated migration
notes. Put active release gates in the relevant plan and rely on Git history
for completed work.

## Authority and current baseline

Use sources in this order:

1. Executable behavior and tests in this repository.
2. The installed `@spree/sdk` types and a verified integration backend.
3. `config/spree-6-source-target.json` and the matching upstream Spree source.
4. This file.
5. The focused documents linked from `docs/README.md`.
6. Memory, examples from other versions, and general framework guidance.

The selected compatibility target is Spree `6.0.0` with `@spree/sdk` `6.0.0`.
Runtime evidence is recorded separately in `config/spree-runtime-baseline.json`;
an unverified target is not runtime or release certification. Treat every Spree
5-to-6 difference as a contract change. A type declaration alone is not
runtime evidence: verify source, installed types, an actual response, and
positive and negative tests.

Local integration paths are workstation configuration. Use
`E2E_SPREE_DEMO_PATH` for a local Rails application and
`E2E_SPREE_BACKEND_VERSION` plus optional `E2E_SPREE_BACKEND_REVISION` for a
remote environment. Do not commit personal paths, account names, private
domains, credentials, customer data, or environment-specific identifiers.

## Product and code ownership

This repository owns one independently deployed TanStack Start storefront.
The application owns its routes, domain, Cloudflare Worker, publishable key,
Channel, cookies, cache, release, and rollback.

```text
src/routes                 URL parsing, loaders, redirects, SEO, and composition
src/components             app-owned presentation and interaction
src/components/ui          accessible, business-free UI primitives
src/config                 navigation, branding, and feature configuration
src/styles                 semantic tokens and the smallest global CSS surface
src/lib/<feature>          server functions, sessions, mappers, and lifecycle
src/lib/core               pure app contracts, validation, and selectors
src/lib/runtime            Spree SDK integration and transport guards
src/lib/spree              existing server client factory, config, and SDK errors
```

Keep code in the feature that owns its lifecycle. Do not introduce a package,
feature flag, plugin layer, or general abstraction without a real second
consumer and a stable shared contract.

Before changing a boundary, read the focused document:

| Change                                              | Required guide                       |
| --------------------------------------------------- | ------------------------------------ |
| App and feature ownership                           | `docs/guides/architecture.md`        |
| Code organization, types, mappers or nullable state | `docs/guides/code-quality.md`        |
| Cart, checkout or payment                           | `docs/guides/checkout.md`            |
| UI, tokens or responsive behavior                   | `docs/guides/ui.md`                  |
| Spree compatibility                                 | `docs/guides/spree.md`               |
| Tests, evidence, deployment or rollback             | `docs/guides/testing-and-release.md` |

## Non-negotiable data boundaries

1. Routes and React components do not fetch Spree directly.
2. Routes and React components do not import `@spree/sdk` or the internal
   Spree adapter directly.
3. Raw external responses pass a feature-owned runtime guard and mapper before
   entering UI state or a TanStack Query cache.
4. Spree remains the source of truth for catalog publication, seller ownership,
   price, inventory, cart, checkout, tax, shipping, payment, and orders.
5. Customer, refresh, cart, order, and privileged provider credentials stay in
   server-only boundaries and httpOnly cookies. They never enter local storage,
   analytics, logs, public errors, or `VITE_*` variables. Provider-scoped client
   secrets required by Stripe.js may cross only the checkout-owned payment
   boundary; follow `docs/guides/checkout.md#payment`.
6. Mutations that change commerce state use the owning feature's server
   function and preserve request-owner checks across asynchronous responses.
7. Query keys include every identity dimension that changes resource ownership,
   including market, customer, cart, and order when relevant.
8. Cart and Order responses must carry the canonical configured Channel ID.
   Missing or mismatched Channel ownership fails before mapping, persistence,
   or caching.
9. Do not infer Market membership from a name. The selected SDK contract uses
   `country_codes`; the former `country_isos` transport field is invalid.
10. Spree customer resources use opaque `cust_…` IDs. Stripe `cus_…` values are
    provider-owned external IDs and must never become storefront identity.

## Sessions, concurrency, and UI state

- Capture the request-start session owner before asynchronous work. A late
  response may update cookies or caches only when the current owner still
  matches that snapshot.
- Use the newest token returned within one request for subsequent backend
  calls, but keep the request-start token as the persistence owner check.
- Network or 5xx failures are not logout signals. Authentication cleanup is
  limited to verified unauthorized or unrecoverable session outcomes.
- Feature mutations must protect both reactive UI state and same-tick
  cross-observer duplication. A pending state that appears after render is not
  a sufficient synchronous guard.
- Customer or market transitions invalidate account, cart, checkout, and
  session-owned review projections before another owner can render.
- Isolate callback failures after a successful server mutation. Navigation,
  refresh, analytics, or parent callbacks must not turn successful commerce
  work into a failed mutation.
- Use TanStack Query for server state. Do not add a second cart store, duplicate
  checkout provider, or general UI global store.

State precedence is:

```text
URL state -> server data -> TanStack Query state -> local React UI state
```

## TypeScript and response mapping

- Keep strict TypeScript enabled. Do not use `any`; narrow `unknown` at the
  external boundary.
- SDK types describe expected transport shape but do not replace runtime
  validation for identities, ownership, nullable fields, or expanded resources.
- Normalize optional values deliberately. Do not mix missing, `undefined`,
  `null`, empty strings, and empty arrays without a documented meaning.
- Components consume normalized app contracts, not SDK resources.
- Prefer discriminated unions for loading, empty, error, unauthorized,
  unavailable, and success states when those states change behavior.
- Keep server-only imports out of client and route graphs. Expose server work
  through feature-owned server functions.

## UI, Base UI, and Tailwind

Shared primitives in `src/components/ui` must:

- remain free of Spree and app business concepts;
- support `className` and merge it with `cn()`;
- preserve keyboard operation, visible focus, ARIA, disabled, and error states;
- preserve focus trapping, focus return, Escape, overlay dismissal, and scroll
  lock where applicable;
- use the locally installed Base UI API and state attributes.

Styling rules:

- Implement new visual behavior in the owning component's Tailwind classes,
  including responsive, hover, focus-visible, disabled, selected, and open
  states.
- Do not create or restore `utilities.css`. Do not add `@utility` or a global
  semantic class only to shorten a class list or style one page.
- Repeated visual behavior becomes an owning component, local view component,
  or business-free primitive variant. Repeated design values become semantic
  or Tailwind theme tokens.
- Prefer Tailwind's standard scale. A precise value that belongs to one
  component and creates no shared contract may use an arbitrary value.
- Global CSS is limited to tokens, fonts, necessary reset/base behavior,
  document-level browser behavior, inaccessible third-party DOM/iframes, and
  platform compatibility that Tailwind cannot express. Keep exceptions narrow
  and explain why they cannot be component-local.
- Support mobile-first layout, light mode, reduced motion, long translations,
  image fallbacks, and all loading/error/empty/pending states. Dark mode is not
  a current acceptance requirement.

## Routes, SEO, and performance

- Routes own params, search parsing, loaders, redirects, SEO, error boundaries,
  and page composition; feature lifecycle stays in `src/lib/<feature>`.
- Prefer SSR for home, listing, product, and policy content.
- Start independent requests concurrently. Do not serialize catalog work behind
  locale or message loading without a dependency.
- Dynamically load heavy drawers, checkout, account, and payment UI when it
  improves the route bundle without changing semantics.
- Public catalog data may be cached with explicit identity and freshness.
  Account, cart, checkout, and server functions are private and never publicly
  cacheable.
- Images need stable dimensions, appropriate responsive sources, loading
  priority, and meaningful alternative text.

## Code organization

- Organize by feature and change reason, not by generic file type.
- Keep route files thin and presentation views free of SDK/session ownership.
- Split files when they mix server/client code, data mapping and rendering, or
  several independent lifecycles. Do not split only to satisfy a line count.
- Do not add `common`, `manager`, `misc`, `helpers`, or broad barrel modules as
  substitutes for clear ownership.
- Preserve one canonical implementation. Remove dead code, obsolete barrels,
  temporary compatibility layers, and completed migration scaffolding.
- Keep generated files and third-party artifacts out of hand-edited source.

## Testing and completion

Match evidence to risk:

- pure selectors and guards: focused unit tests;
- mappers and response boundaries: canonical, malformed, and mixed-owner
  fixtures;
- server functions and sessions: authorization, ownership, retry, and cookie
  tests;
- components: observable behavior, ARIA, focus, pending/error states, and
  callbacks;
- responsive or interaction changes: browser verification at the viewports in
  `docs/guides/ui.md`;
- checkout or payment: local commerce preflight plus relevant checkout
  scenarios in a test environment.

Run `pnpm validate` for the full application gate. A passing local test is not
deployed staging, rollback, jobs, storage, webhook, or live-payment evidence.

## Documentation and Git hygiene

- Keep `AGENTS.md` concise and current. It is policy, not a changelog.
- Keep architecture documents focused on present contracts. Put remaining work
  in an active plan; do not duplicate the same milestone across documents.
- All committed documentation is English. Product UI localization remains in
  the application message catalogs.
- Use neutral examples and configuration names. Never commit personal paths,
  names, private hostnames, credentials, or production/customer data.
- Update machine-readable baselines and their focused documentation together.
- A commit should express one feature, fix, refactor, documentation boundary,
  or dependency change. Do not include unrelated working-tree changes.
- Before committing, review staged file names and the staged diff, run the
  proportional checks, and leave unrelated user changes untouched.
