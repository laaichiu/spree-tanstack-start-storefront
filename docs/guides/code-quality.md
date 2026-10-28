# Code quality

## Review standard

A maintainer should be able to follow a feature's main path, locate the owner of
one rule, and understand failure behavior without remembering hidden conventions.
Assess responsibility, dependency direction and observable behavior alongside
formatting. Line count, file count and test count are not quality targets.

Use domain names, direct control flow and explicit states. Keep straightforward
conditions local. Extract a function when its name explains a meaningful rule,
when callers share that rule, or when it isolates a separate change reason.
Avoid nested ternaries, positional booleans and generic option objects when they
make a small operation harder to read. Explain non-obvious reasons in comments;
let names and types describe ordinary mechanics.

## Ownership

Keep code with the feature that owns its data and lifecycle, following
[architecture](architecture.md#source-ownership). Prefer domain ownership over
broad technical buckets. Keep tests beside the implementation they protect;
browser flows live in the owning app's E2E directory.

## File boundaries and extraction

Split a file when it combines independent change reasons, for example:

- server-only code and client hooks;
- transport validation and React rendering;
- mapping and mutation orchestration;
- several unrelated component lifecycles;
- public contracts and app-specific adapters.

Do not split only to satisfy a line count, and do not reduce file count by
combining unrelated responsibilities. Route files should remain thin: parse
route state, load data, define SEO, and compose a page.

Presentation views receive normalized display data and callbacks. Controllers
or hooks own remote state, transitions, and mutations. Pure selectors and
runtime guards stay outside React. A small component with local interaction
can keep that interaction beside its markup.

The ownership list is a set of possible boundaries, not a mandatory stack.
A feature does not need a view, controller, query, mapper, service and factory
when some would only forward identical arguments. Add a boundary when there is
a real change reason, lifecycle or stable shared responsibility.

| Situation                                         | Appropriate choice                                            |
| ------------------------------------------------- | ------------------------------------------------------------- |
| One short formatting condition                    | Keep it with its owner                                        |
| One rule repeated across real callers             | Extract one domain-named implementation                       |
| Similar JSX with different business rules         | Share a visual primitive; retain each rule's owner            |
| View combines network/session work with rendering | Move remote lifecycle to the feature boundary                 |
| A single deployment needs a custom behavior       | Start in the app; extract packaging when consumers require it |

## Naming and public surfaces

Names should describe domain ownership and responsibility:

- `*-view.tsx` for presentation-focused React views;
- `use-*-controller.ts` for client interaction orchestration;
- `*.server.ts` for server-only implementation;
- `*-mapper.ts` for external-to-normalized projection;
- `*-identity.ts` or `*-guard.ts` for runtime ownership validation;
- `*-query.ts` for query keys and query integration.

These conventions describe roles; they do not require renaming a clear existing
file without another reason. Avoid vague suffixes such as `manager` or `service`
when a domain name would be clearer. A local helper may remain inside its owner.

Keep feature imports explicit and avoid catch-all barrels exposing unrelated
domains. Keep server-only exports separate from client-safe exports. When moving
code, update callers and remove the obsolete path in the same change rather
than leaving compatibility barrels for unsupported consumers.

## Dependency direction

Routes and components consume feature contracts. Features may use pure Core
modules and Runtime integration. UI primitives stay free of feature and Spree
imports. Core remains framework independent.

Use architecture tests to protect these constraints. Do not silence a boundary
failure by widening an allowlist without documenting the new owner. Preserve the
existing Base UI, semantic tokens and component-local Tailwind conventions.

## Types and runtime validation

Keep strict TypeScript enabled. Do not use `any`. External input begins as
`unknown` when runtime shape is not guaranteed and must be narrowed before
field access.

SDK types describe the expected transport contract but do not prove that a
runtime response has the correct identity, ownership, expanded relationship,
or nullable fields. Validate those properties at the feature boundary.

SDK resource types stay in transport adapters. Validate resource family,
requested identity, expansions and relevant owners before mapping into app
contracts. Pure Core contracts remain SDK-free. Use `import type`, declared
public package subpaths and separate server/client exports. Avoid circular
imports and type assertions that hide runtime validation failures.

## Nullability

Choose one meaning for each absence state:

- missing/`undefined`: a field or relationship was not supplied;
- `null`: the backend explicitly reports no value;
- empty string: user-editable text is present but empty only when the domain
  permits it;
- empty array: the collection was supplied and contains no items;
- unavailable state: the resource cannot be used in the current context;
- error state: an attempted operation failed.

Do not use falsy checks when `0`, `false`, or an empty string is valid. Normalize
optional strings with explicit trimming rules. Do not silently coerce malformed
numbers, booleans, arrays, or objects into valid filter or form values.

In presentation code, prefer a direct presence condition for optional labels or
styles when an empty value has no meaning, such as `label && <Label />` or
`active && 'ring-1'`. Avoid explicit `value !== null ? ... : null` branches and
`null` defaults when they add no behavior. Keep explicit null checks for domain
states or whenever an empty string, zero, or `false` must remain distinguishable.
Choose either an optional prop or a required nullable prop when both `undefined`
and `null` would mean the same thing; use both only when they represent distinct
states. Returning `null` from a React component with no UI is still appropriate.

### Example: retain the selected Variant's absent price

Once a Variant is explicitly selected, its missing price remains unavailable.
An offer from the parent or another Variant cannot fill that absence. This
illustrative selector uses existing app contracts and stays outside React:

```ts
import type { ProductVariant } from '@/lib/catalog/contracts'
import type { Money } from '@/lib/core/money'

export function getSelectedVariantPrice(
  variants: readonly ProductVariant[],
  selectedVariantId: string | null,
): Money | null {
  if (selectedVariantId === null) {
    return null
  }

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  )

  return selectedVariant?.price ?? null
}
```

| Input                                     | Result                                     |
| ----------------------------------------- | ------------------------------------------ |
| Selected Variant has a zero amount        | Preserve its zero-valued Money             |
| Selected Variant has null price           | Return null; no parent-price fallback      |
| No selection or ID outside these Variants | Return null; no first-Variant substitution |

Default selection is a separate policy that must first resolve a valid Variant.
The existing card selector and its callers remain the implementation owners;
audit them against this rule instead of adding a parallel price utility. This
example is a presentation projection, not payment arithmetic or a complete
transport identity guard.

## Identifiers and ownership

Treat prefixed resource IDs as opaque identity, not display data. Validate the
expected resource family and exact requested identity before mapping a mutation
response. Provider IDs remain provider-owned and must not become Spree resource
identity.

Nested resources require ownership checks before projection. A media item,
variant, line item, fulfillment, address, payment profile, or review that
belongs to another parent must fail closed rather than enter normalized state.

## Expanded relationships

Distinguish an unexpanded relationship from an expanded empty relationship.
Only consume nested fields when the response contract says they are expanded.
Do not issue a second request merely because an already-expanded collection is
empty.

If a required expanded relationship is malformed or incomplete, return a
feature-local stable error. Optional features may fail closed to disabled or
unavailable only when their contract explicitly permits that fallback.

## UI state

Use discriminated unions when states change rendering or allowed actions:

```ts
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }
```

Do not represent loading, absence, failure, and unauthorized access with the
same `null`. Keep remote mutation state separate from local input state.
The example is feature-local. Reuse the owning feature's existing result type
when it already represents these outcomes; do not introduce one universal state
wrapper for unrelated features. A successful product response with failed facets
can retain its products and represent facets as unavailable independently.

## Errors

Map external errors into stable feature errors before returning them to client
code. Preserve only fields required for behavior, such as a safe status or
known error code. Do not expose response bodies, provider details, secrets,
tokens, stack traces, or customer information.

## Example: a view receives display-ready data

Spree's Dashboard separates a prop-driven resource picker from its query-aware
wrapper. Apply the ownership principle to existing storefront components. This
reduced illustration of `MoneyDisplayView` keeps price calculation, transport,
locale resolution and selection outside the view:

```tsx
import type { MoneyDisplay } from '@/components/shared/money-display'
import { cn } from '@/components/ui/utils'

type MoneyDisplayViewProps = MoneyDisplay & { className?: string }

export function MoneyDisplayView({
  className,
  compareAtPriceLabel,
  priceLabel,
}: MoneyDisplayViewProps) {
  return (
    <span
      className={cn('inline-flex flex-wrap items-baseline gap-2', className)}
    >
      <span>{priceLabel}</span>
      {compareAtPriceLabel && (
        <span className="text-muted-foreground line-through">
          {compareAtPriceLabel}
        </span>
      )}
    </span>
  )
}
```

The caller uses the existing money-display projection for validated app data.
The full [price view](../../src/components/shared/money-display-view.tsx) also
has layout variants. Keep that canonical implementation; this example does not
introduce a second component. The current
[card composition](../../src/components/catalog/catalog-product-card.tsx) and
[pure display selector](../../src/components/catalog/product-card-display.ts)
show the corresponding responsibilities. Their existence alone does not certify
every edge case.

## Example: scope a customer-sensitive query deliberately

Spree's Dashboard query helpers include tenant identity, and its picker only
retains previous results within the same tenant. For a customer-sensitive
storefront read, the same principle can produce a feature-local key like this:

```ts
type AddressBookQueryContext = {
  customerId: string
  country: string
  locale: string
}

export function getAddressBookQueryKey({
  customerId,
  country,
  locale,
}: AddressBookQueryContext) {
  return ['address-book', customerId, country, locale] as const
}
```

This is an illustrative shape, not a new app API or a replacement for existing
factories. Keys include the identities that actually vary the projection.
Cart identity, Channel or a session generation belong where those change the
resource's owner or lifecycle; a fixed deployment value need not be repeated
mechanically. Credentials never belong in query keys.

A key partitions data; it does not authorize a request or make previous data safe
to display. Check ownership before carrying placeholder data across contexts,
clear private projections on identity changes, and retain server authorization
and late-response guards. Reuse current query owners and their tests.

## State and callbacks

Server state belongs to TanStack Query; local UI state belongs to React. Do not
mirror a remote cart or derive a second mutable copy of its totals. Derive simple
display state during rendering; use effects to synchronize external behavior
rather than copying values that can already be calculated.

Mutation ownership remains stable across rerenders, unmounts, customer/Market
transitions and same-tick observers. Capture stable mutation functions rather
than entire changing result objects in callbacks and effects. Use memoization
for an actual identity contract or measured cost, not as decoration.

### Example: preserve a completed write when refresh fails

A saved address remains saved when its follow-up list refresh fails. This focused
example returns that distinction to its caller instead of placing both steps
under one operation-failed result:

```ts
type AddressSaveResult = {
  status: 'saved'
  refresh: 'current' | 'stale'
}

export async function saveAddressAndRefresh({
  saveAddress,
  refreshAddresses,
}: {
  saveAddress: () => Promise<void>
  refreshAddresses: () => Promise<void>
}): Promise<AddressSaveResult> {
  await saveAddress()

  try {
    await refreshAddresses()
    return { status: 'saved', refresh: 'current' }
  } catch {
    return { status: 'saved', refresh: 'stale' }
  }
}
```

A refused write still rejects. A stale refresh produces a saved-state notice
and a read retry; it must not cause another write. In application code this
sequence can remain inside the owning controller. Do not add a generic callback
runner just to share two lines of error handling.

The example assumes the existing mutation owner already handles authorization,
duplicate prevention and late responses. Payment has additional ambiguous-outcome
rules in [checkout architecture](checkout.md); a lost payment response cannot
be treated as either a confirmed failed write or a safe replay.

Navigation, analytics and optional parent callbacks likewise cannot redefine
successful remote work as a failed mutation. Handle their failure locally with
a safe recovery state. Required persistence of purchase access remains part of
commerce completion, not an optional UI follow-up.

## Cleanup and review evidence

Remove dead code, obsolete feature flags, superseded compatibility paths,
unused components and completed migration scaffolding. Verify supported callers
before deleting compatibility behavior. Git history is the archive; do not retain
a second implementation for reference.

Generated output, screenshots, environment files, credentials, personal paths
and backend data dumps do not belong in source control. SDK transport types and
request declarations keep their generated owner; do not manually clone them.

For each substantive cleanup, identify the duplicated rule or mixed lifecycle,
its callers, and the smallest coherent change. Preserve behavior with focused
tests. Useful cases include a selected Variant with no price, an owner change
during a request, a same-tick duplicate action and a failed refresh after success.
Boundary fixtures cover accepted/malformed shapes, wrong types/IDs, missing or
mixed owners, null/omitted/empty relationships and opaque provider identifiers.
A snapshot or test of a trivial forwarding helper is insufficient justification
for introducing that helper.

Reviewers should be able to answer:

- Where does this rule live, and can all callers use that same owner?
- Does every new layer remove a real responsibility or source of duplication?
- Are loading, empty, error, unavailable and unauthorized outcomes distinct?
- Can null or zero be silently replaced with another resource's value?
- Can stale data, a callback or a retry change the meaning of completed work?
- Were obsolete imports, paths and implementations removed together?
- Do tests protect behavior and ownership while docs explain the stable rule?

## Source references and related guidance

Use source patterns selectively. Spree serves several apps and publishes packages;
this repository owns one storefront. A platform registry or package boundary
needs its own justification here. Source links identify the inspected revision;
they do not change this app's selected Spree runtime.

- [Spree prop-driven picker](https://github.com/spree/spree/blob/v6.0.0/packages/dashboard-ui/src/spree/resource-combobox.tsx)
- [Spree query-aware picker](https://github.com/spree/spree/blob/v6.0.0/packages/dashboard-core/src/components/resource-combobox.tsx)
- [Spree scoped query helpers](https://github.com/spree/spree/blob/v6.0.0/packages/dashboard-core/src/lib/query-keys.ts)
- [Spree customization choices](https://spreecommerce.org/docs/developer/customization/quickstart)
- [Spree plugin scope](https://spreecommerce.org/docs/developer/dashboard/plugins/overview)
- [Open release work](../plans/release.md#code-quality-work-packages)
