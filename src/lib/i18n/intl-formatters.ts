const numberFormatters = new Map<string, Intl.NumberFormat>()
const dateFormatters = new Map<string, Intl.DateTimeFormat>()

export function formatNumber(value: number, locale: string) {
  let formatter = numberFormatters.get(locale)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale)
    numberFormatters.set(locale, formatter)
  }

  return formatter.format(value)
}

function formatDateValue(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const formatterKey = `${locale}:${options.timeStyle ? 'datetime' : 'date'}`
  let formatter = dateFormatters.get(formatterKey)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    dateFormatters.set(formatterKey, formatter)
  }

  return formatter.format(date)
}

export function formatDate(value: string, locale: string) {
  return formatDateValue(value, locale, { dateStyle: 'medium' })
}

export function formatDateTime(value: string, locale: string) {
  return formatDateValue(value, locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
