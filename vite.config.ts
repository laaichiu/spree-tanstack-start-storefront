import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

import { readPublicBuildEnv } from './src/lib/env/public'

const isPlaywright = process.env.PLAYWRIGHT === 'true'

const config = defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '')
  const loadedSpreeApiUrl = (loadedEnv as Partial<Record<string, string>>)
    .SPREE_API_URL
  const spreeApiUrl =
    process.env.SPREE_API_URL?.trim() || loadedSpreeApiUrl?.trim()
  const spreeApiOrigin = spreeApiUrl ? new URL(spreeApiUrl).origin : null
  readPublicBuildEnv(loadedEnv, {
    strictProduction: process.env.STOREFRONT_DEPLOY_ENV === 'production',
  })

  if (process.env.STOREFRONT_DEPLOY_ENV === 'production') {
    if (!spreeApiUrl) {
      throw new Error('SPREE_API_URL is required for production builds')
    }

    if (new URL(spreeApiUrl).protocol !== 'https:') {
      throw new Error('SPREE_API_URL must use HTTPS in production')
    }

    const loadedSpreePublishableKey = (
      loadedEnv as Partial<Record<string, string>>
    ).SPREE_PUBLISHABLE_KEY
    const spreePublishableKey =
      process.env.SPREE_PUBLISHABLE_KEY?.trim() ||
      loadedSpreePublishableKey?.trim()

    if (!spreePublishableKey || !spreePublishableKey.startsWith('pk_')) {
      throw new Error(
        'SPREE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
      )
    }
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      ...(isPlaywright ? [] : [devtools()]),
      cloudflare({
        ...(isPlaywright
          ? {
              inspectorPort: false,
              persistState: false,
              remoteBindings: false,
            }
          : {}),
        viteEnvironment: { name: 'ssr' },
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
    // Active Storage's local Disk service returns a URL on the Rails origin.
    // Keep development uploads same-origin so the browser does not block the
    // PUT before it reaches Rails. Production object-storage URLs stay direct.
    ...(spreeApiOrigin
      ? {
          server: {
            proxy: {
              '/rails': {
                changeOrigin: true,
                target: spreeApiOrigin,
              },
            },
          },
        }
      : {}),
  }
})

export default config
