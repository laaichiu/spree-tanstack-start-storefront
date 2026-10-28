import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const budgetPath = resolve(root, 'config/storefront-build-budget.json')
const budget = JSON.parse(readFileSync(budgetPath, 'utf8'))

function listFiles(directory) {
  const absoluteDirectory = resolve(root, directory)

  try {
    return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap(
      (entry) => {
        const absolutePath = join(absoluteDirectory, entry.name)

        if (entry.isDirectory()) {
          return listFiles(relative(root, absolutePath))
        }

        return [absolutePath]
      },
    )
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`
}

const failures = []

for (const entry of budget.entries) {
  const pattern = new RegExp(entry.pattern)
  const candidates = listFiles(entry.directory).filter((file) =>
    pattern.test(relative(resolve(root, entry.directory), file)),
  )

  if (candidates.length !== 1) {
    failures.push(
      `${entry.name}: expected one file matching ${entry.pattern}, found ${candidates.length}`,
    )
    continue
  }

  const file = candidates[0]
  const bytes = statSync(file).size
  const gzipBytes = gzipSync(readFileSync(file)).byteLength
  const exceedsBytes = bytes > entry.maxBytes
  const exceedsGzipBytes = gzipBytes > entry.maxGzipBytes
  const status = exceedsBytes || exceedsGzipBytes ? 'FAIL' : 'PASS'

  console.log(
    `${status} ${entry.name}: ${formatKilobytes(bytes)} raw / ${formatKilobytes(gzipBytes)} gzip ` +
      `(limits ${formatKilobytes(entry.maxBytes)} / ${formatKilobytes(entry.maxGzipBytes)})`,
  )

  if (exceedsBytes) {
    failures.push(
      `${entry.name}: raw size ${bytes} exceeds ${entry.maxBytes} bytes`,
    )
  }

  if (exceedsGzipBytes) {
    failures.push(
      `${entry.name}: gzip size ${gzipBytes} exceeds ${entry.maxGzipBytes} bytes`,
    )
  }
}

for (const graph of budget.graphs ?? []) {
  try {
    const manifestPath = resolve(root, graph.manifest)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const entries = Object.keys(manifest).filter(
      (key) => manifest[key].isEntry === true,
    )
    if (entries.length === 0) throw new Error('no browser entry was found')
    const visited = new Set()
    const files = new Set()
    function visit(key) {
      if (visited.has(key)) return
      visited.add(key)
      const chunk = manifest[key]
      if (!chunk || typeof chunk.file !== 'string')
        throw new Error('a static import is missing from the manifest')
      if (chunk.file.endsWith('.js'))
        files.add(resolve(root, graph.directory, chunk.file))
      for (const imported of chunk.imports ?? []) visit(imported)
    }
    entries.forEach(visit)
    let bytes = 0
    let gzipBytes = 0
    for (const file of files) {
      const content = readFileSync(file)
      bytes += content.byteLength
      gzipBytes += gzipSync(content).byteLength
    }
    const exceeds = bytes > graph.maxBytes || gzipBytes > graph.maxGzipBytes
    console.log(
      `${exceeds ? 'FAIL' : 'PASS'} ${graph.name}: ${files.size} static JS chunks / ${formatKilobytes(bytes)} raw / ${formatKilobytes(gzipBytes)} gzip`,
    )
    if (exceeds)
      failures.push(
        `${graph.name}: initial static JavaScript exceeds ${graph.maxBytes} raw / ${graph.maxGzipBytes} gzip bytes`,
      )
  } catch (error) {
    failures.push(`${graph.name}: ${error.message}`)
  }
}

if (failures.length > 0) {
  console.error('\nBuild budget exceeded:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
}
