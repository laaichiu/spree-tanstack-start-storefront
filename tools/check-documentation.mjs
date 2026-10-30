import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkWorkflows } from './check-workflows.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const failures = []

const documentPaths = [
  'AGENTS.md',
  'README.md',
  'docs/README.md',
  'docs/guides/architecture.md',
  'docs/guides/code-quality.md',
  'docs/guides/checkout.md',
  'docs/guides/ui.md',
  'docs/guides/spree.md',
  'docs/guides/testing-and-release.md',
  'docs/plans/release.md',
  'docs/plans/merchandising.md',
  'docs/plans/seo.md',
  'docs/plans/spree-upgrade.md',
]

const requiredRepositoryPaths = [
  ...documentPaths,
  '.env.example',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'config/spree-6-source-target.json',
  'config/spree-runtime-baseline.json',
  'config/storefront-build-budget.json',
  'tools/check-documentation.mjs',
  ...[
    'ci',
    'deploy-storefront',
    'staging-storefront-smoke',
    'staging-storefront-commerce',
  ].map((name) => `.github/workflows/${name}.yml`),
]

function fail(message) {
  failures.push(message)
}

function read(path) {
  const absolutePath = resolve(repositoryRoot, path)

  if (!existsSync(absolutePath)) {
    fail(`${path} does not exist`)
    return ''
  }

  return readFileSync(absolutePath, 'utf8')
}

function readJson(path) {
  const content = read(path)

  if (!content) {
    return {}
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`)
    return {}
  }
}

function requireText(path, content, expected) {
  if (!content.includes(expected)) {
    fail(`${path} must include ${JSON.stringify(expected)}`)
  }
}

function listMarkdownFiles(directory) {
  const absoluteDirectory = resolve(repositoryRoot, directory)
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const path = resolve(absoluteDirectory, entry.name)

    if (entry.isDirectory()) {
      return listMarkdownFiles(relative(repositoryRoot, path))
    }

    return entry.isFile() && entry.name.endsWith('.md')
      ? [relative(repositoryRoot, path)]
      : []
  })
}

function checkRepositoryFiles() {
  let output

  try {
    output = execFileSync(
      'git',
      [
        'ls-files',
        '--cached',
        '--others',
        '--exclude-standard',
        '--',
        ...requiredRepositoryPaths,
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
  } catch {
    fail(
      'Git file visibility could not be verified; use a complete Git checkout with Git installed',
    )
    return
  }

  const visiblePaths = new Set(output.trim().split(/\r?\n/))

  for (const path of requiredRepositoryPaths) {
    if (!visiblePaths.has(path)) {
      fail(`${path} must be visible to Git; required files cannot be ignored`)
    }
  }
}

function checkDocumentNavigation(content) {
  for (const path of documentPaths) {
    if (!path.startsWith('docs/') || path === 'docs/README.md') continue

    const target = path.slice('docs/'.length)
    if (
      !content.includes(`](${target})`) &&
      !content.includes(`](${target}#`)
    ) {
      fail(`docs/README.md must link to ${target}`)
    }
  }
}

function checkDocumentInventory() {
  const expected = new Set(
    documentPaths.filter((path) => path.startsWith('docs/')),
  )
  const actual = new Set(listMarkdownFiles('docs'))

  for (const path of expected) {
    if (!actual.has(path)) {
      fail(`${path} is missing from the documentation tree`)
    }
  }

  for (const path of actual) {
    if (!expected.has(path)) {
      fail(`${path} is not part of the canonical documentation inventory`)
    }
  }
}

function headingAnchor(heading) {
  return heading
    .replace(/`/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\-\s]/gu, '')
    .trim()
    .replace(/\s/g, '-')
}

function markdownHeadings(content) {
  const headings = []
  let fence

  content.split(/\r?\n/).forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1]
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
        fence = undefined
      return
    }
    if (fence) return
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/)
    if (match) headings.push({ title: match[1], line: index + 1 })
  })

  return headings
}

function checkEnvironmentInventory(content) {
  const examples = new Map(
    [...read('.env.example').matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)].map(
      (match) => [match[1], match[2].trim()],
    ),
  )
  const rows = new Map()

  for (const match of content.matchAll(
    /^\| `([A-Z][A-Z0-9_]*)`\s*\|\s*([^|]+)\|\s*([^|]+)\|/gm,
  )) {
    const [, name, exposure, example] = match
    if (rows.has(name)) fail(`README.md repeats environment variable ${name}`)
    rows.set(name, { exposure: exposure.trim(), example: example.trim() })
  }

  for (const [name, value] of examples) {
    const row = rows.get(name)
    if (!row) {
      fail(`README.md must document .env.example variable ${name}`)
      continue
    }
    if (row.example !== (value ? `\`${value}\`` : 'Empty')) {
      fail(`README.md example value for ${name} must match .env.example`)
    }
    if (row.exposure !== (name.startsWith('VITE_') ? 'Browser' : 'Server')) {
      fail(`README.md exposure for ${name} must match its environment boundary`)
    }
  }

  for (const name of rows.keys()) {
    if (!examples.has(name)) {
      fail(
        `README.md documents environment variable ${name} absent from .env.example`,
      )
    }
  }
}

function checkMarkdown(path, content) {
  const lines = content.split(/\r?\n/)

  if (lines.length > 400) {
    fail(
      `${path} has ${lines.length} lines; canonical documents must remain under 400 lines`,
    )
  }

  if (/\p{Script=Han}/u.test(content)) {
    fail(`${path} contains Chinese text; committed documentation is English`)
  }

  const privacyPatterns = [
    { pattern: /\/Users\//, label: 'a macOS user path' },
    { pattern: /\/home\//, label: 'a Linux user path' },
    {
      pattern: /\bspree\d{6,}\b/i,
      label: 'a date- or workstation-specific backend name',
    },
    {
      pattern: /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b/,
      label: 'a credential-like value',
    },
    {
      pattern:
        /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/,
      label: 'a private network address',
    },
  ]

  for (const { pattern, label } of privacyPatterns) {
    if (pattern.test(content)) {
      fail(`${path} contains ${label}`)
    }
  }

  for (const pattern of [
    /\bSpree 5\.6\.1\b/i,
    /\bCode commit:/i,
    /remain(?:s|ed)? synchronized but uncommitted/i,
    /continue only synchronized, not committed/i,
  ]) {
    if (pattern.test(content)) {
      fail(`${path} contains obsolete implementation-history language`)
    }
  }

  const fenceCount = lines.filter((line) => /^\s*```/.test(line)).length

  if (fenceCount % 2 !== 0) {
    fail(`${path} has an unbalanced fenced code block`)
  }

  const headings = new Map()

  for (const { title, line } of markdownHeadings(content)) {
    const heading = title.replace(/\s*\{#[^}]+\}\s*$/, '')
    const locations = headings.get(heading) ?? []
    locations.push(line)
    headings.set(heading, locations)
  }

  for (const [heading, locations] of headings) {
    if (locations.length > 1) {
      fail(
        `${path} repeats heading ${JSON.stringify(heading)} at lines ${locations.join(', ')}`,
      )
    }
  }

  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, '')

    if (/^(?:https?:|mailto:)/.test(target)) {
      continue
    }

    const [relativePath, fragment] = target.split('#')
    const absolutePath = relativePath
      ? resolve(repositoryRoot, dirname(path), relativePath)
      : resolve(repositoryRoot, path)

    if (!existsSync(absolutePath)) {
      fail(`${path} links to missing path ${match[1]}`)
      continue
    }

    if (fragment && absolutePath.endsWith('.md')) {
      const anchors = new Set(
        markdownHeadings(readFileSync(absolutePath, 'utf8')).map(({ title }) =>
          headingAnchor(title),
        ),
      )
      let decodedFragment
      try {
        decodedFragment = decodeURIComponent(fragment)
      } catch {
        fail(`${path} links to invalid fragment ${match[1]}`)
        continue
      }
      if (!anchors.has(decodedFragment)) {
        fail(`${path} links to missing heading ${match[1]}`)
      }
    }
  }
}

function checkDocumentedCommands(documents) {
  const packageJson = readJson('package.json')
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}))
  const builtIns = new Set(['exec', 'install'])

  for (const { content, path } of documents) {
    for (const match of content.matchAll(
      /(?:`|^\s*)pnpm\s+([a-z][\w:-]*)\b/gm,
    )) {
      const command = match[1]

      if (!scripts.has(command) && !builtIns.has(command)) {
        fail(`${path} references unknown root command pnpm ${command}`)
      }
    }
  }
}

checkDocumentInventory()
checkRepositoryFiles()

const documents = documentPaths.map((path) => ({
  content: read(path),
  path,
}))

for (const { content, path } of documents) {
  checkMarkdown(path, content)
}

checkDocumentedCommands(documents)
checkEnvironmentInventory(read('README.md'))

const sourceTarget = readJson('config/spree-6-source-target.json')
const baseline = readJson('config/spree-runtime-baseline.json')

for (const field of ['spreeVersion', 'spreeRevision', 'sdkVersion']) {
  if (sourceTarget[field] !== baseline[field]) {
    fail(`source target and runtime baseline must agree on ${field}`)
  }
}

for (const [field, expected] of [
  ['spreeVersion', '6.0.1'],
  ['spreeRevision', '49d72a8d982f3fb17231348fd45fd6bf6a2fdc2d'],
  ['sdkVersion', '6.0.1'],
]) {
  if (sourceTarget[field] !== expected) {
    fail(`config/spree-6-source-target.json must set ${field} to ${expected}`)
  }
}

if (
  readJson('package.json').dependencies?.['@spree/sdk'] !==
  sourceTarget.sdkVersion
) {
  fail('package.json must pin @spree/sdk to the selected source target version')
}

if (baseline.status !== 'active') {
  fail('config/spree-runtime-baseline.json must identify an active baseline')
}

checkWorkflows({ read, fail, sourceTarget })

for (const [path, value, forbiddenFields] of [
  [
    'config/spree-6-source-target.json',
    sourceTarget,
    ['sourcePath', 'runtimeStatus'],
  ],
  ['config/spree-runtime-baseline.json', baseline, ['backendPath']],
]) {
  for (const field of forbiddenFields) {
    if (field in value) {
      fail(`${path} must not commit workstation field ${field}`)
    }
  }
}

if (readJson('package.json').name !== 'spree-tanstack-start-storefront') {
  fail('package.json must declare the storefront package name')
}

const agents = read('AGENTS.md')
const docsReadme = read('docs/README.md')
const activePlan = read('docs/plans/release.md')

checkDocumentNavigation(docsReadme)

for (const expected of [
  'This file contains current, durable rules only.',
  'Do not create or restore `utilities.css`.',
  '`E2E_SPREE_DEMO_PATH`',
]) {
  requireText('AGENTS.md', agents, expected)
}

for (const expected of [
  'All committed documentation is English.',
  '[Release plan](plans/release.md)',
]) {
  requireText('docs/README.md', docsReadme, expected)
}

for (const expected of [
  'This plan tracks open release gates for the storefront.',
  'The storefront completion gate closes only when',
]) {
  requireText('docs/plans/release.md', activePlan, expected)
}

if (failures.length > 0) {
  console.error('Documentation integrity check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(
  `Documentation integrity verified: ${documentPaths.length} canonical English documents, task navigation, neutral local configuration, and aligned Spree ${baseline.spreeVersion} / SDK ${baseline.sdkVersion} baselines`,
)
