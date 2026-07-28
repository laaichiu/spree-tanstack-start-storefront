//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@spree/sdk',
              message:
                'Map Spree API responses in src/lib/* before they reach routes or components.',
            },
            {
              name: '@/lib/spree',
              message:
                'Use the feature-level src/lib/* data boundary instead of importing src/lib/spree directly.',
            },
          ],
          patterns: [
            {
              group: ['@/lib/spree/*'],
              message:
                'Use the feature-level src/lib/* data boundary instead of importing src/lib/spree directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@spree/sdk',
              message:
                'Keep src/components/ui business-free; map Spree API responses in src/lib/* first.',
            },
          ],
          patterns: [
            {
              group: [
                '@/lib/account',
                '@/lib/account/*',
                '@/lib/cart',
                '@/lib/cart/*',
                '@/lib/catalog',
                '@/lib/catalog/*',
                '@/lib/checkout',
                '@/lib/checkout/*',
                '@/lib/cookies',
                '@/lib/cookies/*',
                '@/lib/env',
                '@/lib/env/*',
                '@/lib/i18n',
                '@/lib/i18n/*',
                '@/lib/market',
                '@/lib/market/*',
                '@/lib/money',
                '@/lib/money/*',
                '@/lib/newsletter',
                '@/lib/newsletter/*',
                '@/lib/observability',
                '@/lib/observability/*',
                '@/lib/query',
                '@/lib/query/*',
                '@/lib/seo',
                '@/lib/seo/*',
                '@/lib/spree',
                '@/lib/spree/*',
                '@/lib/stripe',
                '@/lib/stripe/*',
              ],
              message:
                'Keep src/components/ui business-free; only shared utilities such as @/lib/utils belong here.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'eslint.config.js',
      'playwright-report/**',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'test-results/**',
    ],
  },
]
