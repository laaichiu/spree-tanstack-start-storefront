import type { CheckoutLayoutShellProps } from '../contracts/checkout'

export type {
  CheckoutLayoutShellBranding,
  CheckoutLayoutShellCapabilities,
  CheckoutLayoutShellModel,
  CheckoutLayoutShellLegalLink,
  CheckoutLayoutShellProps,
} from '../contracts/checkout'

export function CheckoutLayoutShellView({
  capabilities,
  content,
  model,
}: CheckoutLayoutShellProps) {
  const { branding, legalLinks } = model

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="flex h-22 items-center justify-center px-6">
          {capabilities.renderHomeLink(
            <>
              {branding.logoUrl ? (
                <img
                  alt={branding.name}
                  className="h-8 w-auto object-contain sm:h-9"
                  height={76}
                  src={branding.logoUrl}
                  width={189}
                />
              ) : (
                <span className="text-base leading-none font-semibold uppercase tracking-[0.16em]">
                  {branding.name}
                </span>
              )}
            </>,
            'inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        </div>
      </header>
      <main className="min-h-[calc(100vh-9.75rem)]">{content}</main>
      <footer className="border-t border-border bg-background px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <span key={link.id}>
              {capabilities.renderLegalLink(link, {
                children: link.label,
                className:
                  'border-b border-current text-xs leading-4 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              })}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
