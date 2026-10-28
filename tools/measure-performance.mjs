import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { loadEnv } from 'vite'
import process from 'node:process'

const projectRoot = resolve(import.meta.dirname, '..')
const defaultViewport = { width: 1440, height: 1000 }
const defaultPagePaths = [
  '/us/en',
  '/us/en/products',
  '/us/en/cart',
  '/us/en/checkout',
  '/us/en/account/login',
]
const defaultApiPaths = [
  '/api/v3/store/products?per_page=1',
  '/api/v3/store/categories?per_page=1',
  '/api/v3/store/markets',
]

const observerExpression = `(() => {
  window.__storefrontPerformance = {
    cumulativeLayoutShift: 0,
    interactionToNextPaint: null,
    largestContentfulPaint: null,
  }

  if (typeof PerformanceObserver === 'undefined') {
    return false
  }

  try {
    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1)
      if (entry) {
        window.__storefrontPerformance.largestContentfulPaint = entry.startTime
      }
    }).observe({ buffered: true, type: 'largest-contentful-paint' })
  } catch {
    // The browser may not expose LCP in this execution mode.
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__storefrontPerformance.cumulativeLayoutShift += entry.value
        }
      }
    }).observe({ buffered: true, type: 'layout-shift' })
  } catch {
    // The browser may not expose layout-shift in this execution mode.
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId && entry.duration > (window.__storefrontPerformance.interactionToNextPaint ?? 0)) {
          window.__storefrontPerformance.interactionToNextPaint = entry.duration
        }
      }
    }).observe({ buffered: true, durationThreshold: 16, type: 'event' })
  } catch {
    // INP is null for pages without a browser interaction or unsupported APIs.
  }

  return true
})()`

const metricsExpression = `(() => {
  const navigation = performance.getEntriesByType('navigation')[0]
  const resources = performance.getEntriesByType('resource')
  const scripts = resources.filter((entry) => entry.initiatorType === 'script')
  const stylesheets = resources.filter((entry) => entry.initiatorType === 'link' || entry.initiatorType === 'css')
  const performanceState = window.__storefrontPerformance ?? {}

  return {
    path: location.pathname,
    title: document.title,
    navigation: navigation
      ? {
          domContentLoadedMs: navigation.domContentLoadedEventEnd,
          loadMs: navigation.loadEventEnd,
          responseStartMs: navigation.responseStart,
          responseStatus: navigation.responseStatus,
          serverTiming: navigation.serverTiming.map((entry) => ({
            description: entry.description,
            duration: entry.duration,
            name: entry.name,
          })),
          ttfbMs: navigation.responseStart - navigation.startTime,
          transferBytes: navigation.transferSize,
        }
      : null,
    webVitals: {
      cls: performanceState.cumulativeLayoutShift ?? null,
      inpMs: performanceState.interactionToNextPaint ?? null,
      lcpMs: performanceState.largestContentfulPaint ?? null,
    },
    assets: {
      resourceCount: resources.length,
      scriptCount: scripts.length,
      scriptTransferBytes: scripts.reduce((total, entry) => total + entry.transferSize, 0),
      stylesheetCount: stylesheets.length,
      stylesheetTransferBytes: stylesheets.reduce((total, entry) => total + entry.transferSize, 0),
    },
  }
})()`

function printHelp() {
  console.log(`Usage: pnpm measure:performance [options]

Options:
  --base-url <origin>       Storefront origin (default: PLAYWRIGHT_BASE_URL or http://127.0.0.1:3103)
  --viewport <WxH>          Browser viewport (default: 1440x1000)
  --wait-ms <number>        Wait after DOMContentLoaded before reading metrics (default: 1000)
  --pages <path,...>        Page paths to measure
  --api-paths <path,...>    Store API read paths to measure
  --skip-api                Skip Store API probes
  --help                    Show this help

Each page is measured in a new browser session. Network and CPU are intentionally not throttled by this baseline.
Use a staging target and repeat the output across multiple samples before changing cache policy.`)
}

function readOptions(argv) {
  const options = {
    apiPaths: defaultApiPaths,
    baseUrl: process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3103',
    pagePaths: defaultPagePaths,
    skipApi: false,
    viewport: defaultViewport,
    waitMs: 1000,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--help') {
      printHelp()
      process.exit(0)
    }

    if (argument === '--skip-api') {
      options.skipApi = true
      continue
    }

    const value = argv[index + 1]
    if (!value) {
      throw new Error(`Missing value for ${argument}`)
    }

    if (argument === '--base-url') {
      options.baseUrl = value
      index += 1
      continue
    }

    if (argument === '--viewport') {
      const match = value.match(/^(\d+)x(\d+)$/)
      if (!match) {
        throw new Error('--viewport must use the WIDTHxHEIGHT format')
      }
      options.viewport = { height: Number(match[2]), width: Number(match[1]) }
      if (
        Object.values(options.viewport).some(
          (value) => value < 1 || value > 10000,
        )
      )
        throw new Error('Viewport dimensions must be between 1 and 10000')
      index += 1
      continue
    }

    if (argument === '--wait-ms') {
      options.waitMs = Number(value)
      if (
        !Number.isFinite(options.waitMs) ||
        options.waitMs < 0 ||
        options.waitMs > 30_000
      ) {
        throw new Error('--wait-ms must be between 0 and 30000')
      }
      index += 1
      continue
    }

    if (argument === '--pages') {
      options.pagePaths = value
        .split(',')
        .map((path) => path.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (argument === '--api-paths') {
      options.apiPaths = value
        .split(',')
        .map((path) => path.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    throw new Error(`Unknown option: ${argument}`)
  }

  return options
}

function toAbsoluteUrl(baseUrl, path) {
  const base = new URL(baseUrl)
  const target = new URL(path, base)
  if (target.origin !== base.origin || target.username || target.password) {
    throw new Error('Measurement paths must stay on the configured origin')
  }
  return target.toString()
}

async function measurePage({ baseUrl, path, viewport, waitMs }) {
  const browser = await chromium.launch({ timeout: 30_000 })
  try {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    page.setDefaultTimeout(30_000)
    page.setDefaultNavigationTimeout(30_000)
    await page.addInitScript({ content: observerExpression })
    const response = await page.goto(toAbsoluteUrl(baseUrl, path), {
      waitUntil: 'domcontentloaded',
    })
    if (!response?.ok())
      throw new Error('Measurement page did not return a successful response')
    // This sampling window is intentional; it is not a test readiness wait.
    await page.waitForTimeout(waitMs)
    return await page.evaluate(`({
      ...${metricsExpression},
      firstProductPath: document.querySelector('a[href*="/products/"]')?.getAttribute('href') ?? null,
    })`)
  } finally {
    await browser.close()
  }
}

function extractLatestUpdatedAt(value, current = null) {
  if (Array.isArray(value)) {
    return value.reduce(
      (latest, item) => extractLatestUpdatedAt(item, latest),
      current,
    )
  }

  if (!value || typeof value !== 'object') {
    return current
  }

  let latest = current
  for (const [key, item] of Object.entries(value)) {
    if (key === 'updated_at' && typeof item === 'string') {
      const timestamp = Date.parse(item)
      if (
        Number.isFinite(timestamp) &&
        (!latest || timestamp > Date.parse(latest))
      ) {
        latest = item
      }
    }
    latest = extractLatestUpdatedAt(item, latest)
  }

  return latest
}

function parseServerTiming(header) {
  return header
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [namePart, ...parameters] = entry.split(';')
      const duration = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith('dur='))
        ?.slice(4)

      return {
        durationMs: duration ? Number(duration) : null,
        name: namePart,
      }
    })
}

async function measureStoreApi({ apiKey, apiPaths, apiUrl }) {
  const results = []

  for (const path of apiPaths) {
    const startedAt = performance.now()
    const response = await fetch(toAbsoluteUrl(apiUrl, path), {
      signal: AbortSignal.timeout(15_000),
      redirect: 'error',
      headers: {
        Accept: 'application/json',
        'x-spree-api-key': apiKey,
        'x-spree-currency': 'USD',
        'x-spree-locale': 'en',
      },
    })
    const body = await response.arrayBuffer()
    const durationMs = performance.now() - startedAt
    const text = new TextDecoder().decode(body)
    let payload = null

    try {
      payload = JSON.parse(text)
    } catch {
      // Keep the baseline useful for status/header checks even for non-JSON errors.
    }

    results.push({
      cacheControl: response.headers.get('cache-control'),
      durationMs: Number(durationMs.toFixed(2)),
      etag: response.headers.get('etag'),
      httpStatus: response.status,
      latestUpdatedAt: extractLatestUpdatedAt(payload),
      path,
      responseBytes: body.byteLength,
      serverRuntimeMs: response.headers.get('x-runtime')
        ? Number(response.headers.get('x-runtime')) * 1000
        : null,
      serverTiming: parseServerTiming(
        response.headers.get('server-timing') || '',
      ),
      vary: response.headers.get('vary'),
    })
  }

  return results
}

function getDotEnv() {
  return {
    ...loadEnv('development', projectRoot, ''),
    ...process.env,
  }
}

async function main() {
  const options = readOptions(process.argv.slice(2))
  const environment = getDotEnv()
  const baseUrl = new URL(options.baseUrl).origin
  const pages = []
  let productPath = environment.PERF_PDP_PATH?.trim() || null

  for (const path of options.pagePaths) {
    const result = await measurePage({
      baseUrl,
      path,
      viewport: options.viewport,
      waitMs: options.waitMs,
    })
    pages.push(result)

    if (!productPath && path.includes('/products') && result.firstProductPath) {
      productPath = result.firstProductPath
    }
  }

  if (productPath && !options.pagePaths.includes(productPath)) {
    pages.push(
      await measurePage({
        baseUrl,
        path: productPath,
        viewport: options.viewport,
        waitMs: options.waitMs,
      }),
    )
  }

  const apiUrl = environment.SPREE_API_URL?.trim()
  const apiKey = environment.SPREE_PUBLISHABLE_KEY?.trim()
  const storeApi = options.skipApi
    ? { skipped: true, reason: 'disabled by --skip-api' }
    : apiUrl && apiKey
      ? await measureStoreApi({ apiKey, apiPaths: options.apiPaths, apiUrl })
      : {
          skipped: true,
          reason:
            'SPREE_API_URL and SPREE_PUBLISHABLE_KEY are required for Store API probes',
        }

  console.log(
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        profile: {
          browser: 'chromium via project Playwright',
          cache: 'new browser session per page',
          cpu: 'not throttled',
          network: 'not throttled',
          waitAfterDomContentLoadedMs: options.waitMs,
          viewport: options.viewport,
        },
        pages,
        storeApi,
        target: baseUrl,
        tool: 'tools/measure-performance.mjs',
        version: 1,
      },
      null,
      2,
    ),
  )
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
