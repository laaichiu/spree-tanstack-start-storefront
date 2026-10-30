# Release plan

**Status:** Planned; implementation exists, release evidence remains incomplete.
**Reviewed:** 2026-10-28.
**Target:** A reproducible, verified Spree 6 storefront release on Cloudflare.

## Purpose

This plan tracks open release gates for the storefront. It turns remaining work
into ordered deliverables, evidence, and stop conditions. It is not a rewrite
proposal, a completed-work diary, or permission to deploy.

## Plan entry points and ownership

| Read this                              | Responsibility                                               |
| -------------------------------------- | ------------------------------------------------------------ |
| This plan                              | Execution order, commerce safety, release and rollback gates |
| [Contract ledger](spree-upgrade.md)    | Version-specific contracts and their evidence status         |
| [Merchandising plan](merchandising.md) | Catalog, discovery, seller and product interactions          |
| [SEO and branding plan](seo.md)        | Public routes, indexing, metadata and branding               |

Use the [documentation entry point](../README.md#choose-a-task) for current
architecture, quality, checkout and release guidance. The
[code-quality guide](../guides/code-quality.md) provides worked examples for
the quality work packages below.

The storefront maintainer owns app tasks; the backend maintainer owns Rails,
providers and schema; the operator owns domains, credentials and release
acceptance. Assign people in the private work tracker before implementation.
Do not duplicate these milestones in architecture guides or AGENTS.md.

## Selected target and runtime evidence

| Layer        | Selected target                            | Evidence status                                              |
| ------------ | ------------------------------------------ | ------------------------------------------------------------ |
| Spree        | `6.0.1`                                    | `spree-demo` lockfile declares 6.0.1; runtime not reverified |
| Source       | `49d72a8d982f3fb17231348fd45fd6bf6a2fdc2d` | Release tag and Store SEO contract inspected                 |
| Store SDK    | Exactly `@spree/sdk` `6.0.1`               | Installed package and Store types inspected                  |
| Verification | Read `config/spree-runtime-baseline.json`  | Previous 6.0.0 evidence is historical; 6.0.1 gates open      |

`config/spree-6-source-target.json` records the selected compatibility target.
Keep it, runtime evidence, the ledger, baseline guide, CI defaults and installed
SDK aligned. Compare the installed package with the chosen source even if its
version did not change. Do not hand-edit generated SDK types or select moving
`main`.

The repository already has feature-owned guards, mappers, server functions,
queries, payment recovery, SEO helpers and build budgets. Release workflow
presence and executable behavior require a complete release checkout.
Audit and reuse them; implementation presence is not complete release proof.
The historical 6.0.0 read-only browser checks passed. Selected 6.0.0 checkout
checks passed cart reload and delivery readiness, but guest Stripe test-card
completion returned `payment_failed` with an unconfirmed provider cause. These
results do not verify the selected 6.0.1 runtime or close its checkout gate.

## Prioritized gaps

| ID  | Evidence or design gap                                                                              | Required outcome                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| G01 | The final release artifact needs clean-install evidence for its selected dependencies and toolchain | Align local and CI versions, then prove a clean frozen install without absorbing unrelated changes               |
| G02 | Stable guest test-card completion returns a generic payment failure                                 | Capture a redacted provider diagnosis and pass affected plus complete checkout scenarios                         |
| G03 | Local stable upgrade and preflight pass; complete commerce and deployed evidence remain open        | Complete the stable contract and browser gates from the contract ledger                                          |
| G04 | Stable backend requires customer ownership for customer-cart address writes and Store Credit        | Test owner, guest, different customer and stale-session behavior; no credential fallback that bypasses ownership |
| G05 | Password changes revoke refresh sessions; newsletter identity is restricted                         | Verify expected reauthentication and privacy-safe public subscription outcomes                                   |
| G06 | Catalog/filter visibility and cache partitions changed                                              | Prove Channel, Market and buyer-context isolation on every listing surface                                       |
| G07 | Optional capabilities have unequal browser/backend evidence                                         | Declare release scope per capability and hide unsupported entry points                                           |
| G08 | Local success is not deployed cache, CSP, storage, email or payment evidence                        | Attest the deployed environment and exercise staging plus rollback                                               |
| G09 | Public discovery has sitemap, alternate-link and response-status gaps                               | Complete the linked merchandising and SEO phases with actual route evidence                                      |
| G10 | Recorded local passes do not identify a clean release checkout and lockfile                         | Record the exact reproducible artifact; do not transfer a pass to a different lockfile                           |
| G11 | Release workflows need execution evidence in protected GitHub environments                          | Configure environment bindings and protections, then verify CI, deploy and both staging workflows                |

## Non-negotiable implementation contracts

### TanStack Start and Cloudflare execution

- Loaders may run in both environments; routes call feature server functions,
  not the SDK. Protect every private function independently of route guards.
- Verify installed import-protection and middleware APIs. A `.server` filename
  alone is not proof that private code cannot enter a client graph.
- Validate input, authentication, ownership and CSRF at mutation endpoints.
  Bound payload size, redirect targets and observable error detail.
- Request-local SDK configuration and QueryClient state must not leak through
  a long-lived Worker isolate. Hydration never serializes tokens or secrets.
- Keep the current feature/query ownership. Adopt another SSR integration only
  to solve a measured gap, with hydration and client-navigation tests.
- Verify fetch, crypto, cookies, bindings, timeouts and asset handling in the
  built Worker. Local Node success does not establish Workers compatibility.
- Keep HTML, private routes and server functions private/no-store. Public
  caching requires an explicit anonymous context and complete variation keys.

### Sessions, errors and caches

Capture request-start customer, Market, Channel, cart and session generation.
Use rotated credentials inside that request; persist or clear cookies only
while the original owner still matches. A late success cannot overwrite a new
login, cart or Market. Cancel stale reads before applying mutation results.

Refresh once through the account owner. Generic 403, timeout and 5xx responses
are not logout signals. Distinguish invalid credentials, forbidden ownership,
missing resource, stale state, validation failure and backend outage. Clear
private query projections before a different customer can render them.

Keep access and refresh tokens, cart/order access and provider data out of
local storage, URLs, logs, analytics and general hydrated contracts. A
provider-required browser client secret stays in its narrow payment boundary.
No store Admin secret key belongs in this storefront, including its Worker.

### Cart, requirements and delivery

Spree owns prices, quantities, inventory, promotions, tax and totals. Validate
resource IDs, nested ownership, currency and canonical Channel before mapping.
Preserve null money as unavailable; zero is not a substitute for hidden prices.

Render backend `requirements[]` and warnings, including unknown extension
requirements. Do not hard-code a checkout state machine or rebuild commerce
rules in the browser. Re-read after a refused completion and retain user input.

Serialize commerce writes by owner and operation, with a synchronous duplicate
guard as well as visible pending state. Wait for in-flight address and delivery
saves before payment. Compare the latest authoritative quote with what the
buyer approved; changed delivery or totals require review before charging.
A complete address with no rate is distinct from an incomplete address.

### Payment and completion

Treat payment preparation, provider confirmation and cart completion as
separate recoverable stages. A transport error does not prove payment failed.
Before retrying, resolve the existing PaymentSession and completion result;
never create a new charge merely because navigation or a response was lost.

SDK retry keys protect their documented request scope. They do not prove that
an app retry, page reload or concurrent tab is the same business operation.
Reuse verified session identity and backend idempotent completion, and test
ambiguous outcomes. Do not add a second payment state store or generic retry
wrapper that replays all mutations.

- Saved-card operations require the current authenticated owner.
- Pending, processing, authorization, capture, decline and cancellation have
  distinct meanings; do not label authorization as captured payment.
- Zero-due gift-card/credit carts follow backend requirements without creating
  a zero-value payment. Partial balances still use the remaining server amount.
- Provider returns validate owner, expected session and safe return path.
  Wallet address callbacks use the same canonical transport and quote checks.
- Completion accepts Order or OrderGroup. Validate every child and the group
  summary; persist access before clearing the original cart under its owner.
- A completed cart is unavailable at cart endpoints. Recover with orders.get;
  any existing completion replay remains limited to the verified 404 and
  original-credential conditions in the checkout architecture.
- Another guest or customer cannot read confirmation using a copied ID.
  Navigation, analytics or rendering failures after success cannot recharge.

### Capability scope and entry points

| Capability                                          | Release requirement                                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Retail, account, physical checkout                  | Required baseline; all owner and payment paths verified                                                        |
| Seller/Brand display and OrderGroup                 | Keep existing optional presentation; verify server-owned seller filtering and grouped recovery before exposure |
| Reviews                                             | Existing deployment toggle plus a compatible, attested backend extension; moderation and ownership tested      |
| Newsletter                                          | Verify double opt-in, neutral feedback and nullable identity; owner chooses sender                             |
| Store Credit and Gift Cards                         | Separate backend completion proof from browser application/removal and balance UI proof                        |
| Wallets and saved cards                             | Browser evidence for each enabled mode; do not infer from regular card success                                 |
| B2B, Quotes, digital fulfillment, returns/claims UI | Explicit later capability work; SDK availability alone does not create an app feature                          |

Every released feature needs a reachable route/control, authorized server
operation, pending/error/success states and a recovery destination. Disabled
features have no dead menu links, indexable pages or misleading purchase CTA.
Spree Admin MCP and backend extensions are not storefront implementation tasks.

### Accessibility and presentation

Critical account and checkout paths need keyboard operation, visible focus,
named controls, understandable validation and announced pending/error results.
Verify dialog focus trapping/return and provider iframe access. Payment success
must remain recoverable when an embed or nonessential callback fails.

Use the existing visual-baseline viewports, tokens and component-local styles.
Cover long translations, loading, missing media, touch and reduced motion.
Do not introduce a new UI library or animation to close an unrelated gate.

## Execution sequence

### P0: Reproducible baseline and release scope

- [ ] Inventory existing implementations/tests and assign G01-G11 owners.
- [ ] Verify the required workflow files and Git metadata in the release
      checkout; verify automation execution before claiming CI or staging gates.
- [ ] Resolve package-manager/Node/dependency engine compatibility in its own
      change; verify a clean frozen install and the exact CI/runtime toolchain.
- [ ] Review production dependencies and build output using that artifact;
      separate actionable findings from development-only tooling results.
- [ ] Record the selected stable source, package integrity and enabled
      capabilities. Keep unrelated dependency edits separate.
- [ ] Confirm commands, test data isolation and which actual backend the Worker
      calls; a version environment variable alone is insufficient proof.

Exit: a clean-checkout build/test path and an explicit release capability list.

### P1: Diagnose the existing checkout blocker

- [ ] Correlate a synthetic cart, PaymentSession, provider request and Rails
      error with redacted request IDs; capture provider code and failure stage.
- [ ] Separate fixture configuration, test/live key mismatch, network assets,
      provider behavior and storefront/backend defects before choosing a fix.
- [ ] Reproduce saved-card, guest, decline/retry and group failures against
      Spree 6.0 stable with stable fixtures. Do not raise timeouts or weaken
      assertions to hide failures.
- [ ] Compare the stable result with the RC5 baseline; an upgrade alone does
      not establish that the failure is fixed.

Exit: a supported diagnosis or a reproducible, explicitly owned blocker.

### P2: Stable runtime verification and controlled release

- [x] Audit the stable release source, exact Store SDK, package integrity and
      storefront call sites in the contract ledger.
- [x] Verify the local stable schema upgrade and commerce preflight recorded
      in the runtime baseline.
- [ ] Re-attest exact provider gems and required backend customizations for the
      release environment; repeat migration checks when its inputs change.
- [ ] Test owner-only addresses, password revocation, catalog facets, private
      custom fields, newsletter privacy, delivery currencies and payment limits.
- [ ] Run the complete checkout and OrderGroup recovery suite on stable; keep
      all source, type, runtime and deployment evidence distinct.

Exit: stable runtime and required browser scenarios pass for the selected
artifact; the remaining gates below cover deployment and rollback evidence.

### P3: Runtime, session and security hardening

- [ ] Audit imports, every private server function, CSRF and safe redirects.
- [ ] Prove request/isolate isolation, token rotation, logout, Market changes,
      duplicate submissions and stale callbacks across tabs and observers.
- [ ] Verify every exposed account entry: login/registration, password recovery,
      profile, address book and order history. Test direct unauthorized access
      and another customer's resource IDs, not only guarded navigation.
- [ ] Verify Worker runtime behavior and deployed private cache/security headers.

Exit: no identity leak or unauthorized state write in matrix C01-C06.

### P4: Catalog and merchandising closure

- [ ] Execute M0-M6 in the merchandising plan, retaining existing implementations
      where their behavior and evidence already satisfy the contract.
- [ ] Verify backend search customization, seller/category ownership, active
      pricing context, complete pagination and optional-feature fallbacks.

Exit: public discovery and product-to-cart behavior pass the merchandising gate.

### P5: Complete browser commerce evidence

- [ ] Exercise guest/account, new/saved addresses, delivery changes, codes,
      balances, saved cards and every enabled provider mode.
- [ ] Retain backend requirement codes and verify unknown extension
      requirements, completion-only failures and observable warning feedback.
- [ ] Account for local-fixture-only skips in remote runs; every enabled
      capability still needs its complete fixture and browser evidence.
- [ ] Inject lost responses before/after provider success and completion; test
      reload, back navigation, concurrent actions and OrderGroup recovery.
- [ ] Re-run the complete checkout suite after the focused fix; retain error
      traces safely and reset only disposable fixtures.
- [ ] Verify keyboard/focus, form announcements and provider embed behavior at
      the required viewports, including slow assets and recoverable errors.

Exit: all enabled C07-C22 scenarios and C29 pass against the selected runtime.

### P6: SEO, branding and public-route closure

- [ ] Execute S0-S6 in the SEO plan against the same catalog/Market contract.
- [ ] Verify real response codes, SSR content, page-specific canonicals,
      localized alternates, JSON-LD and bounded sitemap generation.

Exit: deployed discovery evidence passes without exposing private content.

### P7: Backend operations and communication ownership

- [ ] Verify jobs, storage, media URLs, mail, payment webhooks, search, backups
      and restores in the intended environment; document backend-owned actions.
- [ ] Confirm one consumer email owner. Keep Spree as the default owner unless
      an approved transition includes verified delivery and duplicate prevention.
- [ ] If the app gains webhook/email work, first define signature validation,
      durable deduplication, asynchronous execution and recovery on Workers.
      `waitUntil` alone is not a durable queue or proof of delivery.

Exit: operational dependencies and optional extensions have deployed evidence.

### P8: Staging, performance and rollback rehearsal

- [ ] Run the full application gate from a clean, pinned checkout.
- [ ] Attest frontend artifact, SDK, backend revision, provider gems, schema,
      Channel and fixtures; keep private identifiers in the deployment system.
- [ ] Run read-only and separately authorized disposable-commerce staging suites.
- [ ] Enforce existing build budgets and measure representative mobile/desktop
      routes under declared network and cache conditions.
- [ ] Rehearse Worker rollback and backend compatibility recovery; an older
      Worker must not assume reversible migrations or obsolete cookies.

Exit: C23-C29 and focused-plan evidence exist for the deployable artifact.

### P9: Promotion and continuing maintenance

- [ ] Review outstanding blockers and capability exclusions with the operator.
- [ ] Promote the tested artifact through the normal approval/release process;
      production smoke remains read-only, with immediate rollback criteria.
- [ ] Observe session errors, payment recovery, checkout drop-off and resource
      budgets through redacted aggregate signals.
- [ ] Schedule future release review in normal project workflow; do not install
      monitoring or publish new services as part of this planning task.

Exit: acceptance is tied to one released artifact and its verified environment.

P0 precedes all work. P1 informs P2; P3 and catalog work can proceed when their
contracts are stable. P5 depends on P2/P3 and P6 on verified catalog identity.
P7/P8 precede P9. No phase rewrites all feature modules merely to match a style.

## Code quality work packages

Execute these inside the owning phases. Inspect code and tests before selecting
a refactor; the guides define review standards, not a finding that every named
module needs replacement.

| Work | Phase and starting scope                                          | Deliverable and review evidence                                                                                              |
| ---- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Q0   | P0: catalog, account, cart, checkout and shared UI                | Map current owners/callers; record actual duplicate rules, mixed lifecycles and obsolete paths                               |
| Q1   | P3/P4: product-card composition, display selectors and price view | Keep transport out of views, retain selected-Variant/null/zero semantics, and avoid forwarding-only layers                   |
| Q2   | P3/P5: cart query/mutation and checkout address/payment owners    | Verify cache partition/cleanup, stable callbacks, late responses and post-success failure isolation                          |
| Q3   | Every implementation change                                       | Remove superseded imports/paths, preserve supported callers, and provide focused behavior tests plus proportional validation |

Each finding names its current owner, concrete problem, smallest proposed change
and verification. Existing passing behavior may satisfy a row without a rewrite.
Do not bundle a repository-wide rename, new framework or dependency upgrade into
an unrelated cleanup. Quality evidence accompanies the affected release gate;
it does not certify backend or browser behavior that was not exercised.

## Acceptance and failure matrix

| ID  | Scenario                                                        | Required result                                                               |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| C01 | SSR requests for two customers/Markets share a Worker isolate   | No shared private SDK/query/session state                                     |
| C02 | A direct private server-function request skips route navigation | Authentication, CSRF and ownership still enforced                             |
| C03 | A rotated-token response arrives after logout/new login         | No stale cookie, cart or query overwrite                                      |
| C04 | Backend 403, timeout or 5xx during a private read               | Preserve valid login; show the correct safe failure                           |
| C05 | Another customer writes an owned cart's address or credit       | Refused before address-book or balance changes                                |
| C06 | Password change invalidates old refresh sessions                | Deliberate reauthentication; no endless refresh loop                          |
| C07 | Rapid duplicate writes from two observers                       | One intended mutation; stable pending state                                   |
| C08 | Address blur/save overlaps Place Order                          | Save completes; changed quote reviewed before charging                        |
| C09 | Complete address has no eligible delivery rate                  | Explicit unavailable state, no invented free delivery                         |
| C10 | Promo/Gift Card rejection or protected-response failure         | Only known code validation allows a code-type fallback                        |
| C11 | Full and partial Gift Card/Store Credit funding                 | Correct backend amount and no duplicate deduction/payment                     |
| C12 | A saved card belongs to another owner/session                   | Rejected; no leaked card or customer projection                               |
| C13 | Provider decline followed by explicit retry                     | No duplicate session/charge; precise recovery                                 |
| C14 | Provider processing or response loss after charge               | Query existing outcome before retrying                                        |
| C15 | Wallet changes country, delivery or total                       | Canonical address validation and fresh quote approval                         |
| C16 | Completion succeeds but response/navigation fails               | Recover existing purchase; do not pay again                                   |
| C17 | Completed cart is read at cart endpoint                         | Follow verified Order/OrderGroup recovery, not empty cart recreation          |
| C18 | Multi-seller purchase completes                                 | Group totals and every child's identity/Channel verified                      |
| C19 | Confirmation reload or group result is lost                     | Owner-bound access persists and safe recovery works                           |
| C20 | Another guest copies an order/group URL                         | No access without the required original credentials                           |
| C21 | Account/Market changes during payment UI load                   | Late callbacks ignored; new owner remains intact                              |
| C22 | Zero-due or hidden-price cart                                   | Distinguish zero, unavailable and authorization requirements                  |
| C23 | CDN/Worker cache sees account/cart/SSR responses                | No private response stored publicly                                           |
| C24 | Staging reports a matching version but wrong actual backend     | Identity/provenance preflight blocks commerce                                 |
| C25 | New release boots with old cookies and cached assets            | Safe migration/reauthentication without identity reassignment                 |
| C26 | Rollback follows a backend/schema change                        | Explicit compatibility decision and repeat smoke                              |
| C27 | Enabled extension/jobs/webhook is unavailable                   | Dependent capability blocked or explicit supported degradation                |
| C28 | Production smoke is invoked                                     | Read-only checks; no live test order or payment                               |
| C29 | Keyboard, provider iframe, validation and dialog recovery       | Reachable controls, visible/restored focus and understandable announced state |

## Evidence, changes and exit criteria

Use focused unit/server/component tests, source-backed SDK transport fixtures where
appropriate, the existing runtime/commerce preflights and Playwright suites.
Keep source-backed mocks separate from actual runtime and deployed evidence.
Run `pnpm check:docs` and `pnpm check` for plan edits; implementation changes
require proportional tests and `pnpm validate`. Do not widen passing budgets
or classify a retry as a fixed root cause.

Each implementation change names its work package, contract, failure behavior,
focused checks and rollback. Update machine-readable evidence only after the
run. Keep raw traces, accounts and environment identifiers out of public docs.

The storefront completion gate closes only when all in-scope acceptance cases,
focused-plan gates and deployed operational dependencies have current evidence
for the selected artifact, with no relevant unknown in the contract ledger.

## References

- [Spree 6.0.1 release](https://github.com/spree/spree/releases/tag/v6.0.1)
- [Spree 6.0.1 Store SDK manifest](https://github.com/spree/spree/blob/v6.0.1/packages/sdk/package.json)
- [TanStack execution boundaries](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
- [Cloudflare TanStack Start deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
