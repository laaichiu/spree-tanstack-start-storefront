# UI and interaction

## Application ownership

The storefront owns its typography, spacing, color, assets, semantic tokens,
responsive layout, and global styles. Primitives in `src/components/ui` provide
accessible, business-free behavior. Keep pages focused on shopping tasks;
avoid generic dashboard patterns and decorative layouts.

## Before changing UI

Identify the concrete visual behavior being changed: typography, spacing,
density, layout, motion, interaction, or responsive behavior. Preserve the
intended result while using the project's Base UI primitives, semantic tokens,
normalized data, and server boundaries.

Component visuals belong primarily in their owning components. `src/styles` is
reserved for tokens, global base rules, and the narrow exceptions below.

## Implementation order

```text
1. semantic tokens and Tailwind theme tokens
2. business-free `src/components/ui` primitive variants
3. component-local Tailwind classes
4. page-local Tailwind classes
5. app global CSS only for a documented global exception
```

Repeated colors, font families, radii, shadows, borders, media ratios, and layout
dimensions should become semantic or Tailwind theme tokens when they represent
a stable design decision.

## Responsive typography and layout

Use Tailwind's default mobile-first breakpoints: `sm` at 40rem, `md` at
48rem, `lg` at 64rem, `xl` at 80rem, and `2xl` at 96rem. Unprefixed classes
define the mobile layout; prefixed classes apply from that width upward.
Do not treat `sm:` as a phone-only rule or choose a separate breakpoint per
page to resize the same text role.

Use Tailwind's built-in font sizes and responsive variants directly in each
owning component. Do not override `--text-*` theme values, introduce font-size
tokens, or create custom typography utility names. Do not resize the document
root to scale the whole interface on phones.

| Role                                                                    | Component-local Tailwind classes     |
| ----------------------------------------------------------------------- | ------------------------------------ |
| Page title, including empty/error/success pages                         | `text-2xl leading-tight md:text-3xl` |
| Product name in the PDP title/price row                                 | `text-sm leading-tight md:text-base` |
| Main section title                                                      | `text-lg md:text-xl`                 |
| Checkout billing-address and shipping-method subsection titles          | `text-base md:text-lg`               |
| Checkout sign-in link and mobile summary label                          | `text-sm`                            |
| Body, supporting text, compact card titles, ordinary labels and actions | `text-xs`                            |
| Primary radio labels and popular search suggestions                     | `text-sm`                            |
| Catalog prices                                                          | `text-sm`                            |
| Listing and PDP compare-at prices                                       | `text-xs`                            |
| Badges and minor metadata                                               | `text-xs`                            |
| Input and textarea primitives                                           | `text-base`                          |
| NativeSelect default and footer newsletter input                        | `text-sm`                            |
| Address selects (owner override)                                        | `text-base`                          |
| Review filter/sort selects (owner override)                             | `text-sm`                            |

The storefront uses a compact type scale. `body` defaults to `text-xs`, and
ordinary copy uses that size across breakpoints and orientations. The table
records larger sizes for specific roles; page and section headings, brand marks,
and emphasized totals retain their distinct roles. Feature owners may override
a primitive's default with native Tailwind classes when the role requires it.

Apply the same native class combination for the same text role across pages,
regardless of the heading element's level. Footer group labels and product-card
titles keep their compact role rather than inheriting a page or section size
from an element selector.
Rich product descriptions combine `prose` with `text-xs leading-5` so HTML and
plain-text descriptions share the same compact body size without custom tokens.

Keep layout changes local to their owner. `lg` is the usual threshold for
catalog/checkout columns; the header switches to desktop navigation at `xl`
because its links need that width. A shared component adapts to its available
space rather than assuming that a desktop viewport guarantees a wide column.
Use flexible heights, wrapping, and `min-w-0` where text can grow; avoid a
fixed content height that clips translated product names or prices.

The PDP product name and price stay in one grid row at every breakpoint.
Use four equal tracks with the title spanning three tracks and `gap-2`, leaving
roughly three-quarters of the row for the title and one-quarter for the
right-aligned price. Keep the gap compact so it does not consume title space.
Align the title's first text baseline with the current price using
`items-baseline`; different font sizes and line heights must not offset the
visible text. Keep this first-line alignment when the title or price wraps.
Long product names wrap inside the title column; prices, including sale and
compare-at prices, stay inside their own column.

## Component-local Tailwind policy

Implement layout, spacing, typography, color, borders, responsive rules, and
hover, focus-visible, disabled, selected, and open states in the owning
component's Tailwind `className`. Compose variants with `cn()` or an explicit
component variant.

- Do not create or restore `utilities.css`.
- Do not add `@utility` or a global semantic class to shorten a class list, hide
  a Tailwind combination, or style one page.
- Repeated visual behavior becomes an owning component, local view component,
  or business-free primitive variant.
- Repeated design values become semantic or Tailwind theme tokens, not custom
  utilities.
- Prefer Tailwind's standard scale. A precise value that belongs to one
  component and creates no cross-component contract may use an arbitrary value.
- A long class list alone is not a reason to extract CSS.

Global CSS is limited to:

- Tailwind theme configuration, CSS variables, semantic tokens, fonts, and
  necessary reset/base rules;
- document-wide or native-element browser behavior that cannot be attached
  reliably to one React component;
- third-party iframes or DOM the application cannot style with component
  classes;
- pseudo-elements, selectors, or platform compatibility Tailwind cannot
  express correctly.

Keep an exception in the existing global entry or a focused style partial.
Minimize selector scope and add a nearby comment explaining why the rule cannot
be component-local.

## Interaction requirements

Bare icon actions use `Button variant="icon"` or the corresponding
`buttonClassName` variant. The icon determines the layout size, and a
transparent pseudo-element provides a minimum 44px
pointer target without padding or negative-margin alignment fixes. Leave enough
space between adjacent actions so their targets do not overlap. Close controls
use `CloseIcon` to trim the unused Lucide X viewBox space while retaining the
stroke. Controls with an intentional filled or bordered surface retain their
own dimensions and centered icons.

- Editable controls use `border-input` at rest, `border-foreground/40` on hover,
  and `border-foreground` while focused. Underline-only controls apply the same
  colors to their bottom border. Keep border width stable, preserve destructive
  borders for invalid fields, and suppress hover feedback while disabled.
- Outlined buttons and category shortcuts use `border-foreground/40` on hover
  and `border-foreground` for keyboard focus (`focus-visible`). Open filter/sort
  triggers and selected filters retain foreground emphasis. Closing a popup by
  pointer restores the default or hover border while preserving focus return;
  keyboard dismissal preserves the visible keyboard focus state.
- Keyboard focus remains visible without relying on mouse-only hover.
- Pointer focus must not introduce an unintended browser outline or thick ring.
- Disabled controls remain readable and non-interactive.
- Dialogs and sheets preserve focus trap, focus return, Escape, overlay close,
  and scroll lock.
- Motion respects `prefers-reduced-motion`.
- Search and other underline-only controls keep their intended border model
  while still showing hover and focus state.
- Input and textarea primitives use `text-base`. NativeSelect defaults and the
  footer newsletter input use `text-sm`. Address selects override the default
  with `text-base`, and review filter/sort selects use `text-sm`. Keep each
  control's size stable across compact and landscape layouts.

## Required viewports

```text
390x844
768x1024
1440x1000
1728x1117
```

Also verify:

- light mode;
- keyboard focus and focus return;
- reduced motion;
- long translations;
- image fallback and layout stability;
- loading, empty, error, disabled, pending, and success states;
- touch scrolling and overlay boundaries;
- no unintended horizontal overflow.

Dark mode is not a current acceptance requirement. Tokens may remain extensible
without adding unused dark-mode complexity.

## Visual evidence

Use component tests for observable interaction and browser checks for computed
layout, focus, overflow, and responsive behavior. Compare the smallest relevant
viewport matrix first, then confirm a desktop regression viewport. Record only
current acceptance criteria in this document; keep one-off screenshots and
completed implementation notes out of source control.
