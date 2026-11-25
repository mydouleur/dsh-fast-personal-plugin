import { gt, prerelease, rcompare, valid } from 'semver'
import type { InstalledPlugin, PluginEntry, PluginState } from '../shared/types.ts'

export interface GithubRemote {
  commit: string
  ref: string
  version?: string
}

export interface InstallResolution {
  target: string
  latestVersion?: string
  remoteCommit?: string
  ref?: string
}

export async function checkForUpdate(entry: PluginEntry, installed: InstalledPlugin, installedCommit?: string): Promise<PluginState> {
  const checkedAt = new Date().toISOString()
  if (entry.source.type === 'npm') {
    const latestVersion = await npmLatestStable(entry.source.package)
    return {
      status: isNewer(latestVersion, installed.version) ? 'update' : 'latest',
      latestVersion,
      lastCheckedAt: checkedAt,
    }
  }
  const remote = await githubRemote(entry.source.repo, entry.source.ref)
  const currentCommit = installed.commit ?? installedCommit
  return {
    status: currentCommit === undefined || currentCommit !== remote.commit ? 'update' : 'latest',
    ...(remote.version === undefined ? {} : { latestVersion: remote.version }),
    remoteCommit: remote.commit,
    ...(currentCommit === undefined ? {} : { installedCommit: currentCommit }),
    ref: remote.ref,
    lastCheckedAt: checkedAt,
  }
}

export async function resolveInstallTarget(entry: PluginEntry, cached?: PluginState): Promise<InstallResolution> {
  if (entry.source.type === 'npm') {
    const latestVersion = cached?.latestVersion ?? await npmLatestStable(entry.source.package)
    return { target: `${entry.source.package}@${latestVersion}`, latestVersion }
  }
  const source = entry.source
  const cachedMatches = cached?.remoteCommit !== undefined && (source.ref === undefined || cached.ref === source.ref)
  const remote = cachedMatches
    ? { commit: cached.remoteCommit!, ref: cached.ref ?? source.ref ?? 'main', ...(cached.latestVersion === undefined ? {} : { version: cached.latestVersion }) }
    : await githubRemote(source.repo, source.ref)
  return {
    target: `git+https://github.com/${source.repo}.git#${remote.commit}`,
    ...(remote.version === undefined ? {} : { latestVersion: remote.version }),
    remoteCommit: remote.commit,
    ref: remote.ref,
  }
}

export async function npmLatestStable(packageName: string): Promise<string> {
  const path = packageName.startsWith('@') ? `@${encodeURIComponent(packageName.slice(1))}` : encodeURIComponent(packageName)
  const metadata = await fetchJson<{
    'dist-tags'?: Record<string, string>
    versions?: Record<string, unknown>
  }>(`https://registry.npmjs.org/${path}`, {
    accept: 'application/vnd.npm.install-v1+json',
  })
  const latest = metadata['dist-tags']?.latest
  if (latest !== undefined && valid(latest) !== null && prerelease(latest) === null) return latest
  const stable = Object.keys(metadata.versions ?? {}).filter((version) => valid(version) !== null && prerelease(version) === null)
  if (stable.length === 0) {
    if (latest !== undefined && valid(latest) !== null) return latest
    throw new Error('npm 包没有可用版本')
  }
  stable.sort(rcompare)
  return stable[0]!
}

export async function githubRemote(repo: string, requestedRef?: string): Promise<GithubRemote> {
  const ref = requestedRef ?? await githubDefaultBranch(repo)
  const commit = await fetchJson<{ sha?: unknown }>(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`, githubHeaders())
  if (typeof commit.sha !== 'string' || !/^[0-9a-f]{40}$/i.test(commit.sha)) throw new Error(`无法解析 ${repo}#${ref} 的 commit`)
  let version: string | undefined
  try {
    const manifest = await fetchJson<{ version?: unknown }>(`https://raw.githubusercontent.com/${repo}/${commit.sha}/package.json`, {})
    if (typeof manifest.version === 'string') version = manifest.version
  } catch { /* a missing package version does not affect commit-based updates */ }
  return { commit: commit.sha, ref, ...(version === undefined ? {} : { version }) }
}

export function gitRefOf(spec: string): string | null {
  const index = spec.lastIndexOf('#')
  return index < 0 ? null : spec.slice(index + 1)
}

async function githubDefaultBranch(repo: string): Promise<string> {
  const metadata = await fetchJson<{ default_branch?: unknown }>(`https://api.github.com/repos/${repo}`, githubHeaders())
  if (typeof metadata.default_branch !== 'string' || metadata.default_branch === '') throw new Error(`无法读取 ${repo} 的默认分支`)
  return metadata.default_branch
}

function githubHeaders(): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    'user-agent': 'dsh-fast-personal-plugin',
    'x-github-api-version': '2022-11-28',
  }
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10_000),
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`${new URL(url).hostname} 返回 HTTP ${response.status}`)
  return await response.json() as T
}

function isNewer(latest: string, current: string): boolean {
  if (valid(latest) !== null && valid(current) !== null) return gt(latest, current)
  return latest !== current
}
