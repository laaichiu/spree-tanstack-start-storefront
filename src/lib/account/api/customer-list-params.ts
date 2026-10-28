export type CustomerListParams<TSort extends string = string> = {
  limit?: number
  page?: number
  sort?: TSort
}

const MAX_CUSTOMER_LIST_LIMIT = 50
const MAX_CUSTOMER_LIST_SORT_LENGTH = 120

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePositiveInteger(value: unknown, field: string, maximum?: number) {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    (maximum !== undefined && value > maximum)
  ) {
    throw new Error(`${field} must be a positive integer.`)
  }

  return value
}

export function parseCustomerListParams<TSort extends string>(
  value: unknown,
  sortKeys: readonly TSort[],
): CustomerListParams<TSort | `-${TSort}`> | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!isRecord(value)) {
    throw new Error('Customer list params must be an object.')
  }

  const params: CustomerListParams<TSort | `-${TSort}`> = {}

  if (value.page !== undefined) {
    params.page = parsePositiveInteger(value.page, 'Customer list page')
  }

  if (value.limit !== undefined) {
    params.limit = parsePositiveInteger(
      value.limit,
      'Customer list limit',
      MAX_CUSTOMER_LIST_LIMIT,
    )
  }

  if (value.sort !== undefined) {
    if (
      typeof value.sort !== 'string' ||
      value.sort.trim().length === 0 ||
      value.sort.length > MAX_CUSTOMER_LIST_SORT_LENGTH
    ) {
      throw new Error('Customer list sort must be a non-empty string.')
    }

    const sort = value.sort.trim()
    const key = sortKeys.find(
      (candidate) => sort === candidate || sort === `-${candidate}`,
    )

    if (!key) {
      throw new Error('Customer list sort is unsupported.')
    }

    params.sort = sort.startsWith('-') ? `-${key}` : key
  }

  return params
}
