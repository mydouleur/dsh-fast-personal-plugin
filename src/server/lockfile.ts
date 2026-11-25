import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { githubRepoOf } from './identity.ts'

export function readLockfileCommits(profileDirectory: string): Map<string, string> {
  const commits = new Map<string, string>()
  let root: unknown
  try {
    root = parse(readFileSync(join(profileDirectory, 'pnpm-lock.yaml'), 'utf8')) as unknown
  } catch {
    return commits
  }
  const visit = (value: unknown, key = ''): void => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return
    const record = value as Record<string, unknown>
    const resolution = objectRecord(record.resolution)
    const identities = [key, record.specifier, resolution?.repo, resolution?.tarball]
      .filter((part): part is string => typeof part === 'string')
    const repo = identities.map(githubRepoOf).find((value): value is string => value !== null) ?? null
    const commit = commitOf(resolution) ?? commitOf(record)
    if (repo !== null && commit !== null) commits.set(repo.toLowerCase(), commit)
    for (const [childKey, child] of Object.entries(record)) {
      if (childKey !== 'resolution') visit(child, childKey)
    }
  }
  visit(root)
  return commits
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function commitOf(record: Record<string, unknown> | undefined): string | null {
  if (record === undefined) return null
  if (typeof record.commit === 'string' && /^[0-9a-f]{40}$/i.test(record.commit)) return record.commit
  if (typeof record.tarball === 'string') {
    const match = /\/tar\.gz\/(?:refs\/(?:heads|tags)\/)?([0-9a-f]{40})(?:$|[?#])/i.exec(record.tarball)
    if (match?.[1] !== undefined) return match[1]
  }
  return null
}
