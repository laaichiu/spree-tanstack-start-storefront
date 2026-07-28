import { Buffer } from 'node:buffer'
import { expect } from '@playwright/test'
import type { Page, Request } from '@playwright/test'

import { sanitizeStripeSecrets } from './stripe-payment'

const ORDER_PLACED_HEADING = /^(?:thanks|thank you) for your order/i
const ORDER_PLACED_REFERENCE = /^Order\s+(?:R\d+|or_[\w-]+)$/i

export async function submitCheckoutAndExpectOrderPlaced(page: Page) {
  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await payNow.scrollIntoViewIfNeeded()
  await expect(payNow).toBeEnabled({ timeout: 30_000 })

  await Promise.all([
    page.waitForURL(/\/order-placed\//, { timeout: 90_000 }),
    payNow.press('Enter'),
  ])

  await expectOrderPlacedPage(page)
}

export async function submitCheckoutAndExpectConfirmPaymentRecovery(
  page: Page,
  completionFailure: Awaited<ReturnType<typeof failNextCompleteCheckoutOrder>>,
) {
  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await payNow.scrollIntoViewIfNeeded()
  await expect(payNow).toBeEnabled({ timeout: 30_000 })

  try {
    await Promise.all([
      page.waitForURL(/\/confirm-payment\//, { timeout: 90_000 }),
      payNow.press('Enter'),
    ])
  } catch (error) {
    throw new Error(
      [
        'Checkout did not navigate to confirm-payment after the injected completion failure.',
        'Observed server functions:',
        completionFailure.describeObserved(),
      ].join('\n'),
      { cause: error },
    )
  }

  try {
    await page.waitForURL(/\/order-placed\//, { timeout: 90_000 })
  } catch (error) {
    throw new Error(
      [
        'Confirm-payment did not recover to order-placed.',
        'Observed server functions:',
        completionFailure.describeObserved(),
        'Page text:',
        await getPageTextSnapshot(page),
      ].join('\n'),
      { cause: error },
    )
  }
  await expectOrderPlacedPage(page)
}

export async function expectOrderPlacedSurvivesServerReload(page: Page) {
  await expect(page).toHaveURL(/\/order-placed\//)
  await page.evaluate(() => {
    sessionStorage.clear()
  })
  await page.reload()
  await expect(page).toHaveURL(/\/order-placed\//)
  await expectOrderPlacedPage(page)
}

export async function expectCartClearedAfterCheckout(
  page: Page,
  productName: string,
) {
  await page.goto('/us/en/cart')
  await expect(
    page.getByRole('heading', { name: /your bag is empty/i }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByText(productName, { exact: false }).first(),
  ).toBeHidden()
  await expect(
    page.getByRole('link', { name: /proceed to checkout/i }),
  ).toBeHidden()
}

export async function submitCheckoutAndExpectPaymentFailure(page: Page) {
  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await payNow.scrollIntoViewIfNeeded()
  await expect(payNow).toBeEnabled({ timeout: 30_000 })
  await payNow.press('Enter')

  await expect(page).toHaveURL(/\/checkout\//)
  await expect(
    page
      .getByText(
        /card (?:has been|was) declined|payment was not successful|payment failed|payment could not be submitted|unable to confirm payment/i,
      )
      .first(),
  ).toBeVisible({ timeout: 60_000 })
}

export async function failNextCompleteCheckoutOrder(page: Page) {
  let intercepted = false
  const observed: string[] = []

  await page.route('**/_serverFn**', async (route, request) => {
    const meta = parseServerFunctionRequestMeta(request.url())
    const body = request.postData() ?? ''
    const isCompleteOrderRequest = isServerFunctionRequest(
      request,
      'completeCheckoutOrder',
      meta,
      body,
    )

    observed.push(
      [
        request.method(),
        meta?.export ?? 'unknown-export',
        isCompleteOrderRequest ? 'complete-order-candidate' : null,
        sanitizeServerFunctionBody(body),
      ]
        .filter(Boolean)
        .join(' '),
    )

    if (!intercepted && isCompleteOrderRequest) {
      intercepted = true
      await route.fulfill({
        body: JSON.stringify({
          result: {
            error: 'Gateway return is still settling',
            errorCode: 'order_complete_failed',
            order: null,
            success: false,
          },
        }),
        contentType: 'application/json',
        status: 200,
      })
      return
    }

    try {
      const response = await route.fetch({ timeout: 120_000 })
      const responseBody = await response.text()

      observed.push(
        ['->', response.status(), meta?.export ?? 'unknown-export']
          .filter(Boolean)
          .join(' '),
      )

      await route.fulfill({
        body: responseBody,
        response,
      })
    } catch (error) {
      observed.push(`-> fetch-error ${getErrorMessage(error)}`)
      throw error
    }
  })

  return {
    describeObserved: () =>
      observed.length > 0 ? observed.join('\n') : '  none',
    wasIntercepted: () => intercepted,
  }
}

async function expectOrderPlacedPage(page: Page) {
  await expect(
    page.getByRole('heading', { name: ORDER_PLACED_HEADING }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(ORDER_PLACED_REFERENCE).first()).toBeVisible({
    timeout: 30_000,
  })
}

function isServerFunctionRequest(
  request: Request,
  functionName: string,
  meta = parseServerFunctionRequestMeta(request.url()),
  body = request.postData() ?? '',
) {
  if (request.method() !== 'POST') {
    return false
  }

  const exportMatches =
    meta?.export === functionName ||
    meta?.export === `${functionName}_createServerFn_handler` ||
    meta?.export?.startsWith(`${functionName}_createServerFn_`)

  if (exportMatches) {
    return true
  }

  return isCompleteCheckoutOrderPayload(body)
}

function parseServerFunctionRequestMeta(url: string) {
  try {
    const pathname = new URL(url).pathname
    const marker = '/_serverFn'
    const markerIndex = pathname.indexOf(marker)

    if (markerIndex < 0) {
      return null
    }

    const encoded = pathname
      .slice(markerIndex + marker.length)
      .replace(/^\//, '')
      .split('/')
      .at(0)

    if (!encoded) {
      return null
    }

    const decoded = Buffer.from(encoded, 'base64url').toString('utf8')
    const parsed = JSON.parse(decoded) as unknown

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const metadata = parsed as { export?: unknown; file?: unknown }

    return {
      export: typeof metadata.export === 'string' ? metadata.export : undefined,
      file: typeof metadata.file === 'string' ? metadata.file : undefined,
    }
  } catch {
    return null
  }
}

function isCompleteCheckoutOrderPayload(body: string) {
  return (
    body.includes('cartId') &&
    body.includes('selectedShippingRate') &&
    !body.includes('sessionId') &&
    !body.includes('paymentMethodId') &&
    !body.includes('externalData') &&
    !body.includes('address') &&
    !body.includes('Address')
  )
}

function sanitizeServerFunctionBody(body: string) {
  if (!body) {
    return ''
  }

  return sanitizeStripeSecrets(body)
    .replace(/\bpi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+/g, 'pi_[redacted]')
    .slice(0, 500)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : String(error)
}

async function getPageTextSnapshot(page: Page) {
  return sanitizeStripeSecrets(
    await page
      .locator('body')
      .innerText({ timeout: 1_000 })
      .catch(() => '  unavailable'),
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1_000)
}
