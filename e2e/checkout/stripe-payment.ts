import { expect } from '@playwright/test'
import type { FrameLocator, Page, Request } from '@playwright/test'

import { HAS_SPREE_DEMO_PATH, runSpreeDemoScript } from './spree-demo'

export const STRIPE_DECLINED_CARD = '4000000000000002'
export const STRIPE_SUCCESS_CARD = '4242424242424242'

type StripeElementsSessionRequest = {
  failure?: string
  method: string
  status: 'failed' | 'finished' | 'pending'
  statusCode?: number
  url: string
}

const stripeElementsSessionRequests = new WeakMap<
  Page,
  StripeElementsSessionRequest[]
>()
const stripeElementsRequestRecords = new WeakMap<
  Request,
  StripeElementsSessionRequest
>()

export function attachStripeDiagnostics(page: Page) {
  const sessionRequests: StripeElementsSessionRequest[] = []
  stripeElementsSessionRequests.set(page, sessionRequests)

  page.on('request', (request) => {
    if (!isStripeElementsSessionRequest(request.url())) {
      return
    }

    const record: StripeElementsSessionRequest = {
      method: request.method(),
      status: 'pending',
      url: request.url(),
    }

    sessionRequests.push(record)
    stripeElementsRequestRecords.set(request, record)
  })

  page.on('requestfinished', async (request) => {
    const record = stripeElementsRequestRecords.get(request)

    if (!record) {
      return
    }

    record.status = 'finished'

    try {
      record.statusCode = (await request.response())?.status()
    } catch (error) {
      record.status = 'failed'
      record.failure =
        error instanceof Error
          ? error.message
          : 'Stripe diagnostics could not read the response.'
    }
  })

  page.on('requestfailed', (request) => {
    const record = stripeElementsRequestRecords.get(request)

    if (!record) {
      return
    }

    record.status = 'failed'
    record.failure = request.failure()?.errorText
  })
}

export async function expectStripePaymentFrameExpanded(page: Page) {
  const frame = page
    .locator(
      '#checkout-section-payment iframe[title="Secure payment input frame"]',
    )
    .first()

  await expect(async () => {
    const box = await frame.boundingBox()

    expect(box?.height ?? 0).toBeGreaterThan(120)
  }).toPass({ timeout: 15_000 })
}

export async function fillStripeCard(page: Page, cardNumberValue: string) {
  const expiry = resolveStripeCardExpiry(cardNumberValue)

  await expect(async () => {
    const cardFrame = await resolveStripeCardFrame(page, 5_000)
    const cardNumber = cardFrame.getByRole('textbox', { name: 'Card number' })
    await expect(cardNumber).toBeVisible({ timeout: 5_000 })
    await cardNumber.fill(cardNumberValue, { timeout: 5_000 })
    await expect(cardNumber).toHaveValue(
      new RegExp(cardNumberValue.slice(-4)),
      {
        timeout: 5_000,
      },
    )
    await cardFrame.getByPlaceholder('MM / YY').fill(expiry, {
      timeout: 5_000,
    })
    await cardFrame
      .getByRole('textbox', { name: 'Security code' })
      .fill('123', {
        timeout: 5_000,
      })

    const zip = cardFrame.getByRole('textbox', { name: /zip code/i })
    if (await zip.count()) {
      await zip.fill('92121', { timeout: 5_000 })
    }
  }).toPass({ timeout: 45_000 })
}

function resolveStripeCardExpiry(cardNumberValue: string) {
  if (!HAS_SPREE_DEMO_PATH || !cardNumberValue.endsWith('4242')) {
    return '12 / 30'
  }

  const script = `
require "date"
require "set"

used_expiries = Spree::CreditCard
  .where(user_id: nil, last_digits: ENV.fetch("E2E_CARD_LAST_DIGITS"))
  .where(deleted_at: nil)
  .pluck(:month, :year)
  .map { |month, year| [month.to_i, year.to_i] }
  .to_set
start_date = Date.new(Date.current.year + 1, Date.current.month, 1)
expiry = (0...120)
  .lazy
  .map { |offset| start_date >> offset }
  .find { |date| !used_expiries.include?([date.month, date.year]) }
raise "No unused Stripe test-card expiry is available." unless expiry
puts expiry.strftime("%m / %y")
`

  return runSpreeDemoScript(script, {
    E2E_CARD_LAST_DIGITS: cardNumberValue.slice(-4),
  })
}

export async function resolveStripeCardFrame(page: Page, timeout = 30_000) {
  const stripeFrames = page.locator(
    'iframe[title="Secure payment input frame"]',
  )
  let cardFrame: FrameLocator | undefined

  try {
    await expect(async () => {
      const frameCount = await stripeFrames.count()

      for (let index = 0; index < frameCount; index += 1) {
        const frame = stripeFrames.nth(index).contentFrame()

        if (await frame.getByRole('textbox', { name: 'Card number' }).count()) {
          cardFrame = frame
          return
        }
      }

      throw new Error('Card form has not rendered in a Stripe frame yet')
    }).toPass({ timeout })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Card form has not rendered in a Stripe frame yet'

    throw new Error(`${message}\n\n${await getStripeFrameDiagnostics(page)}`)
  }

  if (!cardFrame) {
    throw new Error('Stripe card form frame could not be resolved')
  }

  return cardFrame
}

export function sanitizeStripeSecrets(text: string) {
  return text.replace(
    /\b(?:sk|pk)_(?:test|live)_[A-Za-z0-9_*]+/g,
    (value) => `${value.slice(0, 8)}[redacted]`,
  )
}

function isStripeElementsSessionRequest(url: string) {
  return (
    url.startsWith('https://api.stripe.com/v1/elements/sessions') ||
    url.startsWith('https://r.stripe.com/b')
  )
}

function sanitizeStripeUrl(url: string) {
  try {
    const parsed = new URL(url)

    for (const key of ['client_secret', 'key']) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, '[redacted]')
      }
    }

    return parsed.toString()
  } catch {
    return url
  }
}

async function getStripeFrameDiagnostics(page: Page) {
  const frames = await page
    .locator('iframe[title="Secure payment input frame"]')
    .evaluateAll((elements) =>
      elements.map((element, index) => {
        const frame = element as HTMLIFrameElement
        const rect = frame.getBoundingClientRect()

        return {
          height: Math.round(rect.height),
          index,
          src: frame.src,
          styleHeight: frame.style.height,
          width: Math.round(rect.width),
        }
      }),
    )
  const paymentSectionText = await page
    .locator('#checkout-section-payment')
    .innerText({ timeout: 1_000 })
    .catch(() => '')
  const requests = stripeElementsSessionRequests.get(page) ?? []
  const frameLines = frames.length
    ? frames.map(
        (frame) =>
          `  - #${frame.index}: ${frame.width}x${frame.height}, style height ${frame.styleHeight || 'unset'}, ${sanitizeStripeUrl(frame.src)}`,
      )
    : ['  - none']
  const requestLines = requests.length
    ? requests.map((request) => {
        const suffix =
          request.status === 'finished'
            ? `HTTP ${request.statusCode ?? 'unknown'}`
            : request.status === 'failed'
              ? request.failure || 'request failed'
              : 'pending'

        return `  - ${request.method} ${sanitizeStripeUrl(request.url)} -> ${suffix}`
      })
    : ['  - none observed']
  const paymentSectionLines = paymentSectionText.trim()
    ? [
        `  - ${sanitizeStripeSecrets(paymentSectionText)
          .replace(/\s+/g, ' ')
          .trim()}`,
      ]
    : ['  - unavailable']

  return [
    'Stripe diagnostics:',
    'Checkout payment section:',
    ...paymentSectionLines,
    'Payment input frames:',
    ...frameLines,
    'Stripe Elements network requests:',
    ...requestLines,
    'If the checkout payment section shows a provider error such as an expired API key, update the Spree payment method secret key before debugging the iframe.',
    'If the payment iframe stays 2px tall and the Stripe Elements request is pending or failed, check local proxy/VPN access to api.stripe.com.',
  ].join('\n')
}
