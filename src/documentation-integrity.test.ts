// @vitest-environment node

import { execFileSync, spawnSync } from 'node:child_process'
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const repository = fileURLToPath(new URL('../', import.meta.url))
let fixture: string
const isolatedGitEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
)

function rewrite(path: string, update: (content: string) => string) {
  const target = join(fixture, path)
  writeFileSync(target, update(readFileSync(target, 'utf8')))
}

function verify() {
  return spawnSync(process.execPath, ['tools/check-documentation.mjs'], {
    cwd: fixture,
    env: isolatedGitEnvironment,
    encoding: 'utf8',
    timeout: 10_000,
  })
}

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'storefront-doc-check-'))
  for (const path of [
    'docs',
    'config',
    'AGENTS.md',
    'README.md',
    '.env.example',
    '.gitignore',
    'package.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'tools/check-documentation.mjs',
    'tools/check-workflows.mjs',
    '.github',
    'src/components/shared/money-display-view.tsx',
    'src/components/catalog/catalog-product-card.tsx',
    'src/components/catalog/product-card-display.ts',
  ]) {
    const target = join(fixture, path)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(repository, path), target, { recursive: true })
  }

  symlinkSync(
    join(repository, 'node_modules'),
    join(fixture, 'node_modules'),
    'dir',
  )
  execFileSync('git', ['init', '--quiet'], {
    cwd: fixture,
    env: isolatedGitEnvironment,
  })
})

afterEach(() => {
  rmSync(fixture, { recursive: true, force: true })
})

describe('documentation integrity', () => {
  it('accepts aligned documents in a complete synthetic checkout', () => {
    const result = verify()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
  })

  it('rejects an environment variable missing from the README', () => {
    appendFileSync(join(fixture, '.env.example'), '\nVITE_AUDIT_FEATURE=true\n')
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'must document .env.example variable VITE_AUDIT_FEATURE',
    )
  })

  it('rejects a stale example value', () => {
    rewrite('.env.example', (content) =>
      content.replace(
        'SPREE_API_URL=http://localhost:3000',
        'SPREE_API_URL=https://api.example.com',
      ),
    )
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'example value for SPREE_API_URL must match',
    )
  })

  it('rejects an incorrect server/browser boundary', () => {
    rewrite('README.md', (content) =>
      content.replace(/(\| `SPREE_API_URL`\s*\|\s*)Server/, '$1Browser'),
    )
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('exposure for SPREE_API_URL must match')
  })

  it('rejects an undocumented template removal', () => {
    rewrite('.env.example', (content) =>
      content.replace(/^VITE_STOREFRONT_NAME=.*\n/m, ''),
    )
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'VITE_STOREFRONT_NAME absent from .env.example',
    )
  })

  it.each(['#missing-heading', 'docs/guides/spree.md#missing-heading'])(
    'rejects a missing section: %s',
    (target) => {
      appendFileSync(join(fixture, 'README.md'), `\n[Missing](${target})\n`)
      const result = verify()
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`links to missing heading ${target}`)
    },
  )

  it('keeps reporting errors when Git metadata and a workflow are missing', () => {
    rmSync(join(fixture, '.git'), { recursive: true })
    rmSync(join(fixture, '.github/workflows/deploy-storefront.yml'))
    appendFileSync(join(fixture, '.env.example'), '\nVITE_AUDIT_FEATURE=true\n')
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Git file visibility could not be verified')
    expect(result.stderr).toContain('deploy-storefront.yml does not exist')
    expect(result.stderr).toContain(
      'must document .env.example variable VITE_AUDIT_FEATURE',
    )
    expect(result.stderr).not.toContain('Command failed:')
  })

  it('does not accept a code-block heading as a document section', () => {
    appendFileSync(
      join(fixture, 'README.md'),
      '\n```markdown\n## Example heading\n```\n\n[Missing](#example-heading)\n',
    )
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('links to missing heading #example-heading')
  })

  it.each([
    [
      'ci.yml',
      '      - run: pnpm validate',
      '      - run: pnpm validate\n        if: false',
    ],
    ['ci.yml', '  pull_request:', '  workflow_dispatch:'],
    [
      'deploy-storefront.yml',
      '      - run: pnpm run deploy',
      '      # - run: pnpm run deploy',
    ],
    [
      'staging-storefront-commerce.yml',
      "      E2E_COMMERCE_RELEASE: 'true'",
      "      E2E_COMMERCE_RELEASE: 'false'",
    ],
    [
      'staging-storefront-commerce.yml',
      '        default: false',
      '        default: true',
    ],
  ])('rejects a bypassed workflow gate in %s', (name, before, after) => {
    rewrite(`.github/workflows/${name}`, (content) =>
      content.replace(before, after),
    )
    expect(verify().status).toBe(1)
  })

  it('rejects workflow-shaped text without an executable job', () => {
    writeFileSync(
      join(fixture, '.github/workflows/deploy-storefront.yml'),
      'version: 6.0.0\n# pnpm verify:spree-runtime --require-revision\n',
    )
    expect(verify().status).toBe(1)
  })

  it('requires the environment template to remain visible to Git', () => {
    appendFileSync(join(fixture, '.gitignore'), '\n.env.example\n')
    const result = verify()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('.env.example must be visible to Git')
  })
})
