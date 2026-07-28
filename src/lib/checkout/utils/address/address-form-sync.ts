import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

export type CheckoutAddressFormSyncFieldName =
  | keyof CheckoutAddressInput
  | keyof CheckoutBillingAddressInput

type CheckoutAddressFormSyncValues = Partial<
  Record<CheckoutAddressFormSyncFieldName, string>
> & {
  stateAbbr: string
  stateName: string
}

export function getCheckoutAddressFormSyncPlan<
  TFieldName extends CheckoutAddressFormSyncFieldName,
>({
  currentErrorFields = [],
  currentValues,
  fieldNames,
  nextValues,
  shouldValidate,
}: {
  currentErrorFields?: readonly TFieldName[]
  currentValues: CheckoutAddressFormSyncValues
  fieldNames: readonly TFieldName[]
  nextValues: CheckoutAddressFormSyncValues
  shouldValidate: boolean
}) {
  const changedFields: TFieldName[] = []
  const fieldsToValidate = new Set<TFieldName>()

  for (const fieldName of fieldNames) {
    if ((currentValues[fieldName] ?? '') === (nextValues[fieldName] ?? '')) {
      if (shouldValidate && currentErrorFields.includes(fieldName)) {
        fieldsToValidate.add(fieldName)
      }

      continue
    }

    changedFields.push(fieldName)
    if (shouldValidate && currentErrorFields.includes(fieldName)) {
      fieldsToValidate.add(fieldName)
    }
  }

  if (
    fieldsToValidate.has('stateAbbr' as TFieldName) ||
    fieldsToValidate.has('stateName' as TFieldName)
  ) {
    fieldsToValidate.add('stateAbbr' as TFieldName)
    fieldsToValidate.add('stateName' as TFieldName)
  }

  const validationFields = Array.from(fieldsToValidate)
  const fieldsToClear = shouldValidate
    ? validationFields.filter((fieldName) => {
        if (fieldName === 'stateAbbr' || fieldName === 'stateName') {
          return Boolean(
            nextValues.stateAbbr.trim() || nextValues.stateName.trim(),
          )
        }

        return Boolean(nextValues[fieldName]?.trim())
      })
    : []

  return {
    changedFields,
    fieldsToClear,
    fieldsToValidate: validationFields,
  }
}
