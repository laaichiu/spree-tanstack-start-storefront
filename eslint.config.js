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
                'Map Spree API responses in the storefront runtime before they reach routes or components.',
            },
            {
              name: '@/lib/spree',
              message:
                'Use the feature-level src/lib boundary instead of importing the Spree adapter directly.',
            },
          ],
          patterns: [
            {
              group: [
                '@spree/sdk/*',
                '@/lib/spree/*',
                '@/lib/runtime/spree-client*',
                '@/lib/runtime/channel-ownership*',
              ],
              message:
                'Use the feature-level src/lib boundary instead of importing the Spree adapter directly.',
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
                'Keep storefront-ui business-free; map Spree API responses in an application runtime first.',
            },
          ],
          patterns: [
            {
              group: ['@spree/sdk/*'],
              message: 'Keep UI primitives independent from Spree resources.',
            },
            {
              regex: '^@/lib/',
              message:
                'Keep storefront-ui independent from application features.',
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
