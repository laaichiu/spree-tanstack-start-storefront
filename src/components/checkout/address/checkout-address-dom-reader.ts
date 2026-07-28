import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

function getCheckoutFormText(
  formElement: HTMLFormElement,
  key: string,
  fallbackValue = '',
) {
  const control = formElement.elements.namedItem(key)

  if (control && 'value' in control && typeof control.value === 'string') {
    return control.value
  }

  return fallbackValue
}

export function readCheckoutAddressFormValues(
  formElement: HTMLFormElement,
  fallbackValues?: CheckoutAddressInput,
): CheckoutAddressInput {
  return {
    address1: getCheckoutFormText(
      formElement,
      'address1',
      fallbackValues?.address1,
    ),
    address2: getCheckoutFormText(
      formElement,
      'address2',
      fallbackValues?.address2,
    ),
    city: getCheckoutFormText(formElement, 'city', fallbackValues?.city),
    company: getCheckoutFormText(
      formElement,
      'company',
      fallbackValues?.company,
    ),
    countryIso: getCheckoutFormText(
      formElement,
      'countryIso',
      fallbackValues?.countryIso,
    ),
    email: getCheckoutFormText(formElement, 'email', fallbackValues?.email),
    firstName: getCheckoutFormText(
      formElement,
      'firstName',
      fallbackValues?.firstName,
    ),
    lastName: getCheckoutFormText(
      formElement,
      'lastName',
      fallbackValues?.lastName,
    ),
    phone: getCheckoutFormText(formElement, 'phone', fallbackValues?.phone),
    postalCode: getCheckoutFormText(
      formElement,
      'postalCode',
      fallbackValues?.postalCode,
    ),
    stateAbbr: getCheckoutFormText(
      formElement,
      'stateAbbr',
      fallbackValues?.stateAbbr,
    ),
    stateName: getCheckoutFormText(
      formElement,
      'stateName',
      fallbackValues?.stateName,
    ),
  }
}

function getCheckoutControlText(
  rootElement: HTMLElement,
  key: string,
  fallbackValue = '',
) {
  const control = rootElement.querySelector(`[name="${key}"]`)

  if (control && 'value' in control && typeof control.value === 'string') {
    return control.value
  }

  return fallbackValue
}

export function readCheckoutBillingAddressFormValues(
  rootElement: HTMLElement,
  fallbackValues?: CheckoutBillingAddressInput,
): CheckoutBillingAddressInput {
  return {
    address1: getCheckoutControlText(
      rootElement,
      'address1',
      fallbackValues?.address1,
    ),
    address2: getCheckoutControlText(
      rootElement,
      'address2',
      fallbackValues?.address2,
    ),
    city: getCheckoutControlText(rootElement, 'city', fallbackValues?.city),
    company: getCheckoutControlText(
      rootElement,
      'company',
      fallbackValues?.company,
    ),
    countryIso: getCheckoutControlText(
      rootElement,
      'countryIso',
      fallbackValues?.countryIso,
    ),
    firstName: getCheckoutControlText(
      rootElement,
      'firstName',
      fallbackValues?.firstName,
    ),
    lastName: getCheckoutControlText(
      rootElement,
      'lastName',
      fallbackValues?.lastName,
    ),
    phone: getCheckoutControlText(rootElement, 'phone', fallbackValues?.phone),
    postalCode: getCheckoutControlText(
      rootElement,
      'postalCode',
      fallbackValues?.postalCode,
    ),
    stateAbbr: getCheckoutControlText(
      rootElement,
      'stateAbbr',
      fallbackValues?.stateAbbr,
    ),
    stateName: getCheckoutControlText(
      rootElement,
      'stateName',
      fallbackValues?.stateName,
    ),
  }
}
