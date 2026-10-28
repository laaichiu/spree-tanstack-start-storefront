import type { Cart as SpreeCart, Order as SpreeOrder } from '@spree/sdk'

export function normalizeCheckoutText(value: string | null): string | null {
  const normalized = value?.trim() ?? ''

  return normalized || null
}

export function readCheckoutText(value: unknown): string | null {
  return typeof value === 'string' ? normalizeCheckoutText(value) : null
}

export function readCheckoutOrderTextField<T extends string>(
  order: SpreeCart | SpreeOrder,
  field: T,
): string | null {
  return readCheckoutText((order as Partial<Record<T, unknown>>)[field])
}
