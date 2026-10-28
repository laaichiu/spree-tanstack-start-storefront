import { mkdirSync, writeFileSync } from 'node:fs'

// Publish coverage metadata only. Traces, cookies, errors and response bodies
// remain local because commerce artifacts can contain session credentials.
export default class BrowserCoverageReporter {
  onBegin(_config, suite) {
    this.suite = suite
  }
  onEnd(result) {
    const tests = this.suite.allTests().map((test) => ({
      title: test.titlePath().slice(1).join(' > '),
      expectedStatus: test.expectedStatus,
      outcome: test.outcome(),
      attempts: test.results.map((attempt) => attempt.status),
    }))
    if (tests.every((test) => test.attempts.length === 0)) return
    const skipped = tests.filter((test) => test.outcome === 'skipped')
    for (const test of skipped) console.log(`SKIPPED: ${test.title}`)
    mkdirSync('test-results', { recursive: true })
    writeFileSync(
      'test-results/coverage.json',
      JSON.stringify(
        { status: result.status, skipped: skipped.length, tests },
        null,
        2,
      ),
    )
  }
}
