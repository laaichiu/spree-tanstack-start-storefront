// @vitest-environment node

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = fileURLToPath(new URL('.', import.meta.url))
const COMPONENTS_ROOT = resolve(SOURCE_ROOT, 'components')
const LIB_ROOT = resolve(SOURCE_ROOT, 'lib')
const ROUTES_ROOT = resolve(SOURCE_ROOT, 'routes')
const UI_ROOT = resolve(COMPONENTS_ROOT, 'ui')
const CORE_ROOT = resolve(LIB_ROOT, 'core')

type SourceFile = {
  absolutePath: string
  imports: readonly string[]
  relativePath: string
  source: string
  hasRawFetch: boolean
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

function isInside(pathname: string, directory: string) {
  const relativePath = relative(directory, pathname)

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  )
}

function isProductionSource(filename: string) {
  return (
    SOURCE_EXTENSIONS.has(extname(filename)) &&
    !filename.includes('.test.') &&
    !filename.includes('.test-support.')
  )
}

function hasPathSegment(pathname: string, segment: string) {
  return relative(SOURCE_ROOT, pathname).split(sep).includes(segment)
}

function readSourceDependencies(source: string) {
  const sourceFile = ts.createSourceFile(
    'module.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const imports: string[] = []
  let hasRawFetch = false
  function visit(node: ts.Node) {
    if (
      ts.isStringLiteral(node) &&
      (ts.isImportDeclaration(node.parent) ||
        ts.isExportDeclaration(node.parent) ||
        (ts.isCallExpression(node.parent) &&
          node.parent.expression.kind === ts.SyntaxKind.ImportKeyword) ||
        (ts.isLiteralTypeNode(node.parent) &&
          ts.isImportTypeNode(node.parent.parent)))
    ) {
      imports.push(node.text)
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (
        (ts.isIdentifier(callee) && callee.text === 'fetch') ||
        (ts.isPropertyAccessExpression(callee) &&
          callee.name.text === 'fetch' &&
          ts.isIdentifier(callee.expression) &&
          ['globalThis', 'window', 'self'].includes(callee.expression.text)) ||
        (ts.isElementAccessExpression(callee) &&
          ts.isStringLiteral(callee.argumentExpression) &&
          callee.argumentExpression.text === 'fetch' &&
          ts.isIdentifier(callee.expression) &&
          ['globalThis', 'window', 'self'].includes(callee.expression.text))
      )
        hasRawFetch = true
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return { imports, hasRawFetch }
}

function readSourceFiles(directory: string): SourceFile[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = resolve(directory, entry.name)

      if (entry.isDirectory()) {
        return readSourceFiles(absolutePath)
      }

      if (!entry.isFile() || !isProductionSource(entry.name)) {
        return []
      }

      const source = readFileSync(absolutePath, 'utf8')

      return [
        {
          absolutePath,
          ...readSourceDependencies(source),
          relativePath: relative(SOURCE_ROOT, absolutePath),
          source,
        },
      ]
    })
}

function resolveInternalImport(file: SourceFile, moduleSpecifier: string) {
  if (moduleSpecifier.startsWith('@/')) {
    return resolve(SOURCE_ROOT, moduleSpecifier.slice(2))
  }

  if (moduleSpecifier.startsWith('.')) {
    return resolve(dirname(file.absolutePath), moduleSpecifier)
  }

  return null
}

function isSpreeSdkImport(moduleSpecifier: string) {
  return (
    moduleSpecifier === '@spree/sdk' ||
    moduleSpecifier.startsWith('@spree/sdk/')
  )
}

function formatImportViolation(file: SourceFile, moduleSpecifier: string) {
  return `${file.relativePath}: ${moduleSpecifier}`
}

const sourceFiles = readSourceFiles(SOURCE_ROOT)

describe('root storefront architecture boundaries', () => {
  it('does not restore deleted theme and private runtime aliases', () => {
    const violations = sourceFiles.flatMap((file) =>
      file.imports
        .filter(
          (moduleSpecifier) =>
            moduleSpecifier.startsWith('#runtime/') ||
            moduleSpecifier.startsWith('@theme/'),
        )
        .map((moduleSpecifier) => formatImportViolation(file, moduleSpecifier)),
    )

    expect(violations).toEqual([])
  })

  it('keeps presentation contracts free of migration-era Theme names', () => {
    const violations = sourceFiles
      .filter((file) => /\bTheme[A-Z]\w*/.test(file.source))
      .map((file) => file.relativePath)
    expect(violations).toEqual([])
  })

  it('reads static imports, re-exports, dynamic imports, and import types without scanning comments', () => {
    expect(
      readSourceDependencies(`
      // import '@spree/sdk'
      const copy = "import '@spree/sdk'"
      import type { Product } from '@spree/sdk'
      export { client } from '@/lib/spree/client.server'
      const client = import(/* server boundary */ '@/lib/runtime/spree-client')
      type Client = import('@/lib/spree/client.server').Client
    `),
    ).toEqual({
      hasRawFetch: false,
      imports: [
        '@spree/sdk',
        '@/lib/spree/client.server',
        '@/lib/runtime/spree-client',
        '@/lib/spree/client.server',
      ],
    })
  })

  it('detects direct and global fetch calls while ignoring copy and comments', () => {
    for (const source of [
      "fetch('/api')",
      "globalThis.fetch('/api')",
      "window.fetch('/api')",
      "self['fetch']('/api')",
    ]) {
      expect(readSourceDependencies(source).hasRawFetch).toBe(true)
    }
    expect(
      readSourceDependencies(`// fetch('/api')\nconst copy = "fetch('/api')"`)
        .hasRawFetch,
    ).toBe(false)
  })

  it('keeps routes and components outside SDK, Spree client, and raw fetch boundaries', () => {
    const storefrontFiles = sourceFiles.filter(
      (file) =>
        isInside(file.absolutePath, ROUTES_ROOT) ||
        isInside(file.absolutePath, COMPONENTS_ROOT),
    )
    const violations = storefrontFiles.flatMap((file) => {
      const importViolations = file.imports.flatMap((moduleSpecifier) => {
        const resolvedImport = resolveInternalImport(file, moduleSpecifier)
        const importsSpreeBoundary =
          isSpreeSdkImport(moduleSpecifier) ||
          (resolvedImport !== null &&
            (isInside(resolvedImport, resolve(LIB_ROOT, 'spree')) ||
              ['spree-client', 'channel-ownership'].some(
                (name) =>
                  resolvedImport.replace(/\.tsx?$/, '') ===
                  resolve(LIB_ROOT, 'runtime', name),
              )))

        return importsSpreeBoundary
          ? [formatImportViolation(file, moduleSpecifier)]
          : []
      })
      const fetchViolations = file.hasRawFetch
        ? [`${file.relativePath}: raw fetch()`]
        : []

      return [...importViolations, ...fetchViolations]
    })

    expect(violations).toEqual([])
  })

  it('limits SDK imports to feature API, mapper, and Spree client boundaries', () => {
    const violations = sourceFiles.flatMap((file) => {
      const importsSdk = file.imports.some(isSpreeSdkImport)
      const isAllowedBoundary =
        isInside(file.absolutePath, resolve(LIB_ROOT, 'runtime')) ||
        isInside(file.absolutePath, resolve(LIB_ROOT, 'spree')) ||
        file.relativePath.includes('/api/') ||
        file.relativePath.includes('/mappers/')

      return importsSdk && !isAllowedBoundary
        ? [`${file.relativePath}: @spree/sdk`]
        : []
    })

    expect(violations).toEqual([])
  })

  it('keeps domain contracts framework-independent', () => {
    const contractFiles = sourceFiles.filter(
      (file) =>
        isInside(file.absolutePath, LIB_ROOT) &&
        hasPathSegment(file.absolutePath, 'contracts'),
    )
    const violations = contractFiles.flatMap((file) =>
      file.imports.flatMap((moduleSpecifier) => {
        const resolvedImport = resolveInternalImport(file, moduleSpecifier)
        const importsAllowedDomainCode =
          moduleSpecifier.startsWith('@/lib/core/') ||
          (resolvedImport !== null &&
            hasPathSegment(resolvedImport, 'contracts'))

        return importsAllowedDomainCode
          ? []
          : [formatImportViolation(file, moduleSpecifier)]
      }),
    )

    expect(violations).toEqual([])
  })

  it('keeps UI primitives independent from app features and routes', () => {
    const violations = sourceFiles
      .filter((file) => isInside(file.absolutePath, UI_ROOT))
      .flatMap((file) =>
        file.imports.flatMap((moduleSpecifier) => {
          const resolvedImport = resolveInternalImport(file, moduleSpecifier)
          return isSpreeSdkImport(moduleSpecifier) ||
            (resolvedImport !== null && !isInside(resolvedImport, UI_ROOT))
            ? [formatImportViolation(file, moduleSpecifier)]
            : []
        }),
      )
    expect(violations).toEqual([])
  })

  it('keeps Core independent from frameworks and feature lifecycles', () => {
    const violations = sourceFiles
      .filter((file) => isInside(file.absolutePath, CORE_ROOT))
      .flatMap((file) =>
        file.imports.flatMap((moduleSpecifier) => {
          const resolvedImport = resolveInternalImport(file, moduleSpecifier)
          const importsCore =
            resolvedImport !== null && isInside(resolvedImport, CORE_ROOT)
          const importsFramework =
            /^(?:react(?:$|[-/])|@tanstack\/|@spree\/)/.test(moduleSpecifier)
          return importsCore || (resolvedImport === null && !importsFramework)
            ? []
            : [formatImportViolation(file, moduleSpecifier)]
        }),
      )
    expect(violations).toEqual([])
  })

  it('prevents feature runtime from importing storefront components', () => {
    const violations = sourceFiles
      .filter((file) => isInside(file.absolutePath, LIB_ROOT))
      .flatMap((file) =>
        file.imports.flatMap((moduleSpecifier) => {
          const resolvedImport = resolveInternalImport(file, moduleSpecifier)

          return resolvedImport !== null &&
            isInside(resolvedImport, COMPONENTS_ROOT)
            ? [formatImportViolation(file, moduleSpecifier)]
            : []
        }),
      )

    expect(violations).toEqual([])
  })
})
