import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const budgetPath = resolve(root, 'config/build-budget.json')
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

if (failures.length > 0) {
  console.error('\nBuild budget exceeded:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
}
