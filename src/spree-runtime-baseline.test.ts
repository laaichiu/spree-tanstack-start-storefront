// @vitest-environment node

import { spawnSync } from 'node:child_process'
import {
  readFileSync,
  mkdirSync,
  mkdtempSync,
  cpSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const script = fileURLToPath(
  new URL('tools/check-spree-runtime-baseline.mjs', root),
)
const baseline = JSON.parse(
  readFileSync(new URL('config/spree-runtime-baseline.json', root), 'utf8'),
) as {
  sdkVersion: string
  spreeVersion: string
  spreeRevision: string
}

function verify(options: {
  strict?: boolean
  version?: string
  revision?: string
}) {
  const env = { ...process.env }
  delete env.E2E_SPREE_DEMO_PATH
  delete env.E2E_SPREE_BACKEND_VERSION
  delete env.E2E_SPREE_BACKEND_REVISION
  if (options.version !== undefined)
    env.E2E_SPREE_BACKEND_VERSION = options.version
  if (options.revision !== undefined)
    env.E2E_SPREE_BACKEND_REVISION = options.revision
  return spawnSync(
    process.execPath,
    [script, ...(options.strict ? ['--require-revision'] : [])],
    {
      env,
      encoding: 'utf8',
      timeout: 10_000,
    },
  )
}

describe('release runtime attestation', () => {
  it('accepts the exact selected source tuple for a release', () => {
    expect(
      verify({
        strict: true,
        version: baseline.spreeVersion,
        revision: baseline.spreeRevision,
      }).status,
    ).toBe(0)
  })

  it.each([undefined, '', '   '])(
    'rejects a release without a source revision: %j',
    (revision) => {
      const result = verify({
        strict: true,
        version: baseline.spreeVersion,
        revision,
      })
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        'release workflows require E2E_SPREE_BACKEND_REVISION',
      )
    },
  )

  it('preserves version-only checks for ad hoc read-only evidence', () => {
    expect(verify({ version: baseline.spreeVersion }).status).toBe(0)
  })

  it.each([
    {
      version: `${baseline.spreeVersion}.beta4`,
      revision: baseline.spreeRevision,
    },
    { version: baseline.spreeVersion, revision: '0'.repeat(40) },
    { revision: baseline.spreeRevision },
  ])('rejects an incomplete or mismatched tuple %j', (tuple) => {
    expect(verify({ strict: true, ...tuple }).status).toBe(1)
  })
})

describe('local Spree lockfile provenance', () => {
  function verifyLockfile(lockfile: string, strict = false) {
    const fixture = mkdtempSync(join(tmpdir(), 'spree-lockfile-'))
    try {
      for (const path of [
        'tools',
        'config',
        'node_modules/@spree/sdk',
        'backend',
      ])
        mkdirSync(join(fixture, path), { recursive: true })
      cpSync(script, join(fixture, 'tools/check-spree-runtime-baseline.mjs'))
      cpSync(
        fileURLToPath(new URL('config/spree-runtime-baseline.json', root)),
        join(fixture, 'config/spree-runtime-baseline.json'),
      )
      writeFileSync(
        join(fixture, 'node_modules/@spree/sdk/package.json'),
        JSON.stringify({ version: baseline.sdkVersion }),
      )
      writeFileSync(join(fixture, 'backend/Gemfile.lock'), lockfile)
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        E2E_SPREE_DEMO_PATH: join(fixture, 'backend'),
      }
      delete env.E2E_SPREE_BACKEND_VERSION
      delete env.E2E_SPREE_BACKEND_REVISION
      return spawnSync(
        process.execPath,
        [
          join(fixture, 'tools/check-spree-runtime-baseline.mjs'),
          ...(strict ? ['--require-revision'] : []),
        ],
        { env, encoding: 'utf8', timeout: 10_000 },
      )
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  }
  function gitSource(name: string, revision: string) {
    return `GIT\n  remote: https://example.com/${name}.git\n  revision: ${revision}\n  specs:\n    ${name} (${baseline.spreeVersion})\n\n`
  }
  it('reads the revision from the Spree source after unrelated Git dependencies', () => {
    const lockfile =
      gitSource('other', '0'.repeat(40)) +
      gitSource('spree', baseline.spreeRevision)
    expect(verifyLockfile(lockfile).status).toBe(0)
    expect(verifyLockfile(lockfile, true).status).toBe(0)
    expect(verifyLockfile(lockfile.replaceAll('\n', '\r\n')).status).toBe(0)
  })
  it('rejects a wrong Spree revision even when another source matches', () => {
    expect(
      verifyLockfile(
        gitSource('other', baseline.spreeRevision) +
          gitSource('spree', '0'.repeat(40)),
      ).status,
    ).toBe(1)
  })
  it('does not assign an unrelated Git revision to a registry Spree gem', () => {
    expect(
      verifyLockfile(
        gitSource('other', '0'.repeat(40)) +
          `GEM\n  remote: https://rubygems.org/\n  specs:\n    spree (${baseline.spreeVersion})\n`,
      ).status,
    ).toBe(0)
  })
  it('rejects duplicate, incomplete and path-based Spree sources', () => {
    for (const lockfile of [
      gitSource('spree', baseline.spreeRevision).repeat(2),
      gitSource('spree', 'short'),
      `PATH\n  remote: .\n  specs:\n    spree (${baseline.spreeVersion})\n`,
    ])
      expect(verifyLockfile(lockfile).status).toBe(1)
  })
})
