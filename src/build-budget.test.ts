// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function verifyGraph(options: {
  maxBytes: number
  missingImport?: boolean
  emptyEntries?: boolean
}) {
  const fixture = mkdtempSync(join(tmpdir(), 'storefront-budget-'))
  try {
    for (const path of ['tools', 'config', 'dist/client'])
      mkdirSync(join(fixture, path), { recursive: true })
    cpSync(
      fileURLToPath(
        new URL('../tools/check-build-budget.mjs', import.meta.url),
      ),
      join(fixture, 'tools/check-build-budget.mjs'),
    )
    writeFileSync(
      join(fixture, 'config/storefront-build-budget.json'),
      JSON.stringify({
        entries: [],
        graphs: [
          {
            name: 'initial graph',
            manifest: 'dist/client/manifest.json',
            directory: 'dist/client',
            maxBytes: options.maxBytes,
            maxGzipBytes: 10000,
          },
        ],
      }),
    )
    for (const name of ['entry', 'route', 'shared'])
      writeFileSync(join(fixture, `dist/client/${name}.js`), 'x'.repeat(100))
    writeFileSync(
      join(fixture, 'dist/client/manifest.json'),
      JSON.stringify({
        entry: {
          file: 'entry.js',
          isEntry: !options.emptyEntries,
          imports: ['route', 'shared'],
        },
        route: {
          file: 'route.js',
          imports: [options.missingImport ? 'absent' : 'shared'],
        },
        shared: { file: 'shared.js' },
      }),
    )
    return spawnSync(process.execPath, ['tools/check-build-budget.mjs'], {
      cwd: fixture,
      encoding: 'utf8',
      timeout: 10000,
    })
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
}

describe('initial browser dependency budget', () => {
  it('counts static imports and deduplicates shared chunks', () => {
    const result = verifyGraph({ maxBytes: 300 })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('3 static JS chunks')
  })
  it('rejects a budget exceeded by moving code into another static chunk', () => {
    expect(verifyGraph({ maxBytes: 299 }).status).toBe(1)
  })
  it.each([{ missingImport: true }, { emptyEntries: true }])(
    'fails closed on an incomplete graph: %j',
    (patch) => {
      expect(verifyGraph({ maxBytes: 10000, ...patch }).status).toBe(1)
    },
  )
})
