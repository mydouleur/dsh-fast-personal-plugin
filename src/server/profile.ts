import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { InstalledPlugin, PluginEntry } from '../shared/types.ts'
import { profileDirectory, readJsonFile, writeJsonFile } from './files.ts'
import { entryId, githubRepoOf, validPackageName } from './identity.ts'

interface ProfileManifest {
  dependencies?: Record<string, string>
  dsh?: { profile?: { bundles?: unknown } }
}

interface PackageManifest {
  version?: unknown
  repository?: unknown
  dsh?: { bundle?: unknown }
}

export function profileFromArgv(argv: readonly string[], fallback = 'web'): string {
  const index = argv.indexOf('--profile')
  const candidate = index >= 0 ? argv[index + 1] : undefined
  if (candidate !== undefined && !candidate.startsWith('-')) return candidate
  const equals = argv.find((arg) => arg.startsWith('--profile='))
  if (equals !== undefined && equals.length > '--profile='.length) return equals.slice('--profile='.length)
  for (const arg of argv.slice(2)) {
    if (arg === '' || arg.startsWith('-')) continue
    if (basename(dirname(arg)) === 'profiles' && basename(arg) !== '') return basename(arg)
  }
  return fallback
}

export function scanInstalled(profile: string): Record<string, InstalledPlugin> {
  const directory = profileDirectory(profile)
  const manifest = readJsonFile<ProfileManifest>(join(directory, 'package.json'))
  if (manifest === null) return {}
  const bundles = Array.isArray(manifest.dsh?.profile?.bundles)
    ? manifest.dsh.profile.bundles.filter((value): value is string => typeof value === 'string')
    : []
  const installed: Record<string, InstalledPlugin> = {}
  for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
    if (name.startsWith('@deepseek-ai/') || !validPackageName(name)) continue
    const metadata = readJsonFile<PackageManifest>(join(directory, 'node_modules', name, 'package.json'))
    if (metadata?.dsh?.bundle === undefined || metadata.dsh.bundle === null) continue
    const repository = repositoryUrl(metadata.repository)
    installed[name] = {
      package: name,
      version: typeof metadata.version === 'string' ? metadata.version : '0.0.0',
      spec,
      enabled: bundles.includes(name),
      ...(repository === null ? {} : { repository }),
    }
  }
  return installed
}

export function entryForInstalled(installed: InstalledPlugin): PluginEntry {
  const specRepo = githubRepoOf(installed.spec)
  const manifestRepo = githubRepoOf(installed.repository)
  const repo = specRepo ?? (isLocalSpec(installed.spec) ? manifestRepo : null)
  if (repo !== null) {
    return {
      id: entryId({ type: 'github', repo }),
      source: { type: 'github', repo },
      enabled: installed.enabled,
      package: installed.package,
    }
  }
  return {
    id: entryId({ type: 'npm', package: installed.package }),
    source: { type: 'npm', package: installed.package },
    enabled: installed.enabled,
    package: installed.package,
  }
}

export function installedForEntry(entry: PluginEntry, installed: Record<string, InstalledPlugin>): InstalledPlugin | null {
  if (entry.source.type === 'npm') return installed[entry.source.package] ?? null
  if (entry.package !== undefined && installed[entry.package] !== undefined) return installed[entry.package]!
  const repo = entry.source.repo.toLowerCase()
  return Object.values(installed).find((candidate) => githubRepoOf(candidate.spec)?.toLowerCase() === repo) ?? null
}

export function setBundleEnabled(profile: string, packageName: string, enabled: boolean): void {
  const path = join(profileDirectory(profile), 'package.json')
  const manifest = readJsonFile<ProfileManifest & Record<string, unknown>>(path)
  if (manifest === null) throw new Error('无法读取当前 profile 的 package.json')
  const dsh = manifest.dsh ?? {}
  const profileConfig = dsh.profile ?? {}
  const bundles = Array.isArray(profileConfig.bundles)
    ? profileConfig.bundles.filter((value): value is string => typeof value === 'string')
    : []
  const next = bundles.filter((name) => name !== packageName)
  if (enabled) next.push(packageName)
  manifest.dsh = { ...dsh, profile: { ...profileConfig, bundles: next } }
  writeJsonFile(path, manifest)
}

export function packageHasClient(profile: string, packageName: string): boolean {
  const path = join(profileDirectory(profile), 'node_modules', packageName, 'package.json')
  if (!existsSync(path)) return false
  try {
    const manifest = JSON.parse(readFileSync(path, 'utf8')) as { dsh?: { client?: unknown } }
    return manifest.dsh?.client !== undefined && manifest.dsh.client !== null
  } catch {
    return false
  }
}

function repositoryUrl(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value !== null && typeof value === 'object') {
    const url = (value as { url?: unknown }).url
    return typeof url === 'string' ? url : null
  }
  return null
}

function isLocalSpec(spec: string): boolean {
  return /^(?:file|link|portal):/i.test(spec) || spec.startsWith('.') || spec.startsWith('/')
}
