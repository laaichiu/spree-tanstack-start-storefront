import type {
  CheckoutSignInLinkCapabilities,
  CheckoutSignInLinkModel,
} from '../contracts/checkout'

export type {
  CheckoutSignInLinkCapabilities,
  CheckoutSignInLinkModel,
} from '../contracts/checkout'

export function CheckoutSignInLinkView({
  capabilities,
  model,
}: {
  capabilities: CheckoutSignInLinkCapabilities
  model: CheckoutSignInLinkModel
}) {
  return capabilities.renderLink(
    model.label,
    'text-sm leading-5 text-muted-foreground underline underline-offset-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  )
}
