export function toSpreeLocaleCode(locale: string): string {
  // URL and cookie locales are lowercase. Rails compares supported locales
  // exactly, including regional casing such as pt-BR and zh-CN.
  const code = Intl.getCanonicalLocales(locale.trim().replace(/_/g, '-'))[0]
  if (!code) throw new Error('The locale code is invalid.')
  return code
}
