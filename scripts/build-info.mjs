// One description of the build, captured once when Vite loads its config.
// The bundle and dist/version.json both read it, so the footer, the JSON file
// and the deploy always agree on which commit is being served.
import { execFileSync } from 'node:child_process'

function readCommit() {
  const fromEnvironment = process.env.GITHUB_SHA?.trim()
  if (fromEnvironment) return fromEnvironment

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const commit = readCommit()

export const buildInfo = Object.freeze({
  commit,
  shortCommit: commit ? commit.slice(0, 7) : 'dev',
  builtAt: new Date().toISOString(),
})
