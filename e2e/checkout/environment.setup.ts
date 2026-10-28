import { execFileSync } from 'node:child_process'
import { test } from '@playwright/test'
// The Node-side probe never enters the application bundle.
import { verifyCommerceTarget } from '../../tools/verify-commerce-target.mjs'

test('commerce environment matches the disposable backend preflight', async ({
  baseURL,
}) => {
  test.setTimeout(120_000)
  execFileSync(
    process.execPath,
    [
      'tools/check-spree-runtime-baseline.mjs',
      ...(process.env.E2E_COMMERCE_RELEASE === 'true'
        ? ['--require-revision']
        : []),
    ],
    { stdio: 'pipe', timeout: 15_000 },
  )
  execFileSync(process.execPath, ['tools/check-spree-commerce-runtime.mjs'], {
    stdio: 'pipe',
    timeout: 75_000,
  })
  if (!baseURL) throw new Error('A storefront base URL is required')
  await verifyCommerceTarget(baseURL)
})
