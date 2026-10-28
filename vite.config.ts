import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

import { readPublicBuildEnv } from './src/lib/env/public.ts'

const isPlaywright = process.env.PLAYWRIGHT === 'true'

const config = defineConfig(({ mode }) => {
  // Vite's environment map can omit keys despite its Record<string, string> type.
  const loadedEnv: Record<string, string | undefined> = loadEnv(
    mode,
    process.cwd(),
    '',
  )
  const loadedSpreeApiUrl = loadedEnv.SPREE_API_URL
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

    const loadedSpreePublishableKey = loadedEnv.SPREE_PUBLISHABLE_KEY
    const spreePublishableKey =
      process.env.SPREE_PUBLISHABLE_KEY?.trim() ||
      loadedSpreePublishableKey?.trim()
    const loadedSpreeChannel = loadedEnv.SPREE_CHANNEL
    const spreeChannel =
      process.env.SPREE_CHANNEL?.trim() || loadedSpreeChannel?.trim()

    if (!spreePublishableKey || !spreePublishableKey.startsWith('pk_')) {
      throw new Error(
        'SPREE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
      )
    }

    if (!spreeChannel) {
      throw new Error('SPREE_CHANNEL is required for production builds')
    }
  }

  return {
    build: { manifest: true },
    resolve: {
      tsconfigPaths: true,
    },
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
    server: {
      // Browser traces contain HTML snapshots; watching them reloads the
      // active checkout and invalidates in-flight provider initialization.
      watch: {
        ignored: [
          '**/output/**',
          '**/test-results/**',
          '**/playwright-report/**',
          '**/.playwright-cli/**',
        ],
      },
      ...(spreeApiOrigin
        ? {
            proxy: {
              '/rails': {
                changeOrigin: true,
                target: spreeApiOrigin,
              },
            },
          }
        : {}),
    },
  }
})

export default config
