import { existsSync, readFileSync, readdirSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Static architecture guard; this is intentionally a Vitest test, not a browser E2E test.

const sourceRoot = resolve(process.cwd(), 'src')

type SourceImport = {
  file: string
  kind: 'dynamic' | 'static'
  specifier: string
  target: string | null
}

function isProductionSource(entry: Dirent) {
  return (
    entry.isFile() &&
    /\.tsx?$/.test(entry.name) &&
    !/\.(?:test|spec)\.tsx?$/.test(entry.name) &&
    entry.name !== 'routeTree.gen.ts'
  )
}

function listProductionFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      return listProductionFiles(path)
    }

    return isProductionSource(entry) ? [path] : []
  })
}

function toProjectPath(path: string) {
  return relative(sourceRoot, path).split(sep).join('/')
}

function resolveSourceTarget(file: string, specifier: string) {
  if (specifier.startsWith('@/')) {
    return specifier.slice(2)
  }

  if (specifier.startsWith('.')) {
    return toProjectPath(resolve(dirname(file), specifier))
  }

  return null
}

function resolveProjectSourceFile(file: string, specifier: string) {
  const target = resolveSourceTarget(file, specifier)

  if (!target) {
    return null
  }

  const extensionCandidates = ['', '.ts', '.tsx', '.js', '.jsx']
  const candidates = extensionCandidates.flatMap((extension) => {
    const path = resolve(sourceRoot, `${target}${extension}`)

    return extension
      ? [path]
      : [
          path,
          ...extensionCandidates.slice(1).map((item) => `${path}/index${item}`),
        ]
  })

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function readImports(file: string): SourceImport[] {
  const source = readFileSync(file, 'utf8')
  const imports: SourceImport[] = []
  const patterns = [
    {
      kind: 'static' as const,
      pattern:
        /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    },
    {
      kind: 'dynamic' as const,
      pattern: /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    },
  ]

  for (const { kind, pattern } of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1]

      if (!specifier) {
        continue
      }

      imports.push({
        file: toProjectPath(file),
        kind,
        specifier,
        target: resolveSourceTarget(file, specifier),
      })
    }
  }

  return imports
}

function readDirectoryImports(directory: 'components' | 'lib' | 'routes') {
  return listProductionFiles(resolve(sourceRoot, directory)).flatMap(
    readImports,
  )
}

function formatViolation(sourceImport: SourceImport) {
  return `${sourceImport.file} -> ${sourceImport.specifier}`
}

function targetsDirectory(target: string | null, directory: string) {
  return target === directory || target?.startsWith(`${directory}/`) === true
}

function findProductionImportCycles(files: string[]) {
  const productionFiles = new Set(files)
  const graph = new Map(
    files.map((file) => [
      file,
      readImports(file)
        .map((sourceImport) =>
          resolveProjectSourceFile(file, sourceImport.specifier),
        )
        .filter((target): target is string =>
          target ? productionFiles.has(target) : false,
        ),
    ]),
  )
  const visited = new Set<string>()
  const stack: string[] = []
  const stackIndexes = new Map<string, number>()
  const cycles = new Set<string>()

  function formatCycle(nodes: string[]) {
    const names = nodes.map(toProjectPath)
    const first = Math.min(...names.map((name) => names.indexOf(name)))
    const rotated = [...names.slice(first), ...names.slice(0, first)]

    return rotated.join(' -> ')
  }

  function visit(file: string) {
    const stackIndex = stackIndexes.get(file)

    if (stackIndex !== undefined) {
      cycles.add(formatCycle(stack.slice(stackIndex)))
      return
    }

    if (visited.has(file)) {
      return
    }

    stackIndexes.set(file, stack.length)
    stack.push(file)

    for (const target of graph.get(file) ?? []) {
      visit(target)
    }

    stack.pop()
    stackIndexes.delete(file)
    visited.add(file)
  }

  for (const file of files) {
    visit(file)
  }

  return [...cycles].sort()
}

function importsSpreeInfrastructure(sourceImport: SourceImport) {
  return (
    sourceImport.specifier === '@spree/sdk' ||
    sourceImport.specifier.startsWith('@spree/sdk/') ||
    targetsDirectory(sourceImport.target, 'lib/spree')
  )
}

function importsServerOnlyModule(sourceImport: SourceImport) {
  return (
    sourceImport.target?.includes('.server') === true ||
    targetsDirectory(sourceImport.target, 'lib/env')
  )
}

describe('source import boundaries', () => {
  const componentImports = readDirectoryImports('components')
  const routeImports = readDirectoryImports('routes')
  const libImports = readDirectoryImports('lib')

  it('keeps Spree SDK and client infrastructure out of components and routes', () => {
    const violations = [...componentImports, ...routeImports]
      .filter(importsSpreeInfrastructure)
      .map(formatViolation)

    expect(violations).toEqual([])
  })

  it('keeps server-only modules out of components and static route imports', () => {
    const violations = [
      ...componentImports,
      ...routeImports.filter((sourceImport) => sourceImport.kind === 'static'),
    ]
      .filter(importsServerOnlyModule)
      .map(formatViolation)

    expect(violations).toEqual([])
  })

  it('keeps UI primitives independent from application libraries', () => {
    const violations = componentImports
      .filter((sourceImport) => sourceImport.file.startsWith('components/ui/'))
      .filter(
        (sourceImport) =>
          targetsDirectory(sourceImport.target, 'lib') &&
          sourceImport.target !== 'lib/utils',
      )
      .map(formatViolation)

    expect(violations).toEqual([])
  })

  it('keeps application libraries independent from React components', () => {
    const violations = libImports
      .filter((sourceImport) =>
        targetsDirectory(sourceImport.target, 'components'),
      )
      .map(formatViolation)

    expect(violations).toEqual([])
  })

  it('keeps the production source graph free of import cycles', () => {
    const files = ['components', 'lib', 'routes'].flatMap((directory) =>
      listProductionFiles(resolve(sourceRoot, directory)),
    )

    expect(findProductionImportCycles(files)).toEqual([])
  })
})
