import type { StorefrontShellProps } from '../contracts/layout'

export type {
  StorefrontShellProps,
  StorefrontShellSlots,
} from '../contracts/layout'

/**
 * The storefront owns the shared document structure. Runtime
 * remains responsible for producing the header, footer, page content, and any
 * deferred interactive slots.
 */
export function StorefrontShellView({ children, slots }: StorefrontShellProps) {
  return (
    <>
      {slots.header}
      <main>{children}</main>
      {slots.footer}
      {slots.newsletterPopup}
    </>
  )
}
