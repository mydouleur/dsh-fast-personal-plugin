import { existsSync } from 'node:fs'
import { DEFAULT_CONFIG_URL, type PluginEntry, type PluginsFile, type PluginState, type StateFile } from '../shared/types.ts'
import { configPath, readJsonFile, statePath, writeJsonFile } from './files.ts'
import { emptyConfig, isSelfEntry, normalizeConfig } from './identity.ts'

function emptyState(): StateFile {
  return { schemaVersion: 1, previousPlugins: [], pendingRemovals: [], plugins: {} }
}

export class ConfigStore {
  config: PluginsFile = emptyConfig()
  state: StateFile = emptyState()
  defaultsError?: string

  async initialize(fetchDefault: (url: string) => Promise<unknown> = defaultFetch): Promise<PluginEntry[]> {
    if (!existsSync(configPath())) {
      try {
        this.config = normalizeConfig(await fetchDefault(DEFAULT_CONFIG_URL))
        writeJsonFile(configPath(), this.config)
      } catch (error) {
        this.defaultsError = `默认清单下载失败：${errorMessage(error)}`
        this.config = emptyConfig()
      }
    } else {
      this.config = normalizeConfig(readJsonFile(configPath()))
    }
    this.state = normalizeState(readJsonFile(statePath()))
    const previous = this.state.previousPlugins
    const pending = new Map(this.state.pendingRemovals.filter((entry) => !isSelfEntry(entry)).map((entry) => [entry.id, entry]))
    for (const entry of previous) {
      if (!this.config.plugins.some((candidate) => candidate.id === entry.id)) pending.set(entry.id, entry)
    }
    let changed = false
    for (const entry of previous.filter(isSelfEntry)) {
      if (!this.config.plugins.some((candidate) => isSelfEntry(candidate))) {
        this.config.plugins.push(entry)
        changed = true
      }
      pending.delete(entry.id)
    }
    this.state.previousPlugins = this.config.plugins
    this.state.pendingRemovals = [...pending.values()]
    if (changed || !existsSync(configPath())) writeJsonFile(configPath(), this.config)
    this.saveState()
    return this.state.pendingRemovals
  }

  replace(nextValue: unknown): PluginEntry[] {
    const next = normalizeConfig(nextValue)
    const removed = this.config.plugins.filter((entry) => !next.plugins.some((candidate) => candidate.id === entry.id))
    for (const entry of this.config.plugins.filter(isSelfEntry)) {
      if (!next.plugins.some((candidate) => isSelfEntry(candidate))) next.plugins.push(entry)
    }
    this.config = next
    this.trackRemovals(removed.filter((entry) => !isSelfEntry(entry)))
    this.commit()
    return removed.filter((entry) => !isSelfEntry(entry))
  }

  async importDefaults(): Promise<number> {
    return this.merge(await defaultFetch(DEFAULT_CONFIG_URL))
  }

  merge(nextValue: unknown): number {
    const next = normalizeConfig(nextValue)
    const existing = new Set(this.config.plugins.map((entry) => entry.id))
    const additions = next.plugins.filter((entry) => !existing.has(entry.id))
    if (additions.length === 0) return 0
    this.config.plugins.push(...additions)
    const imported = new Set(additions.map((entry) => entry.id))
    this.state.pendingRemovals = this.state.pendingRemovals.filter((entry) => !imported.has(entry.id))
    this.commit()
    return additions.length
  }

  upsert(entry: PluginEntry, originalId?: string): PluginEntry[] {
    const next = this.config.plugins.filter((candidate) => candidate.id !== entry.id && candidate.id !== originalId)
    next.push(entry)
    return this.replace({ schemaVersion: 1, plugins: next })
  }

  remove(id: string): PluginEntry | null {
    const entry = this.config.plugins.find((candidate) => candidate.id === id)
    if (entry === undefined) return null
    if (isSelfEntry(entry)) throw new Error('插件管理器不能卸载自身')
    this.replace({ schemaVersion: 1, plugins: this.config.plugins.filter((candidate) => candidate.id !== id) })
    return entry
  }

  setEnabled(id: string, enabled: boolean): PluginEntry {
    const entry = this.require(id)
    const updated = { ...entry, enabled }
    this.upsert(updated)
    return updated
  }

  setPackage(id: string, packageName: string): void {
    const entry = this.require(id)
    if (entry.package === packageName) return
    this.upsert({ ...entry, package: packageName })
  }

  require(id: string): PluginEntry {
    const entry = this.config.plugins.find((candidate) => candidate.id === id)
    if (entry === undefined) throw new Error('插件不在清单中')
    return entry
  }

  setPluginState(id: string, state: PluginState): void {
    this.state.plugins[id] = state
    this.saveState()
  }

  completeRemoval(id: string): void {
    this.state.pendingRemovals = this.state.pendingRemovals.filter((entry) => entry.id !== id)
    delete this.state.plugins[id]
    this.saveState()
  }

  private trackRemovals(entries: PluginEntry[]): void {
    const pending = new Map(this.state.pendingRemovals.map((entry) => [entry.id, entry]))
    for (const entry of entries) pending.set(entry.id, entry)
    this.state.pendingRemovals = [...pending.values()]
  }

  private commit(): void {
    this.state.previousPlugins = this.config.plugins
    writeJsonFile(configPath(), this.config)
    this.saveState()
  }

  private saveState(): void {
    writeJsonFile(statePath(), this.state)
  }
}

function normalizeState(value: unknown): StateFile {
  if (value === null || typeof value !== 'object') return emptyState()
  const raw = value as Partial<StateFile>
  return {
    schemaVersion: 1,
    previousPlugins: Array.isArray(raw.previousPlugins) ? raw.previousPlugins.map(normalizeConfigEntry) : [],
    pendingRemovals: Array.isArray(raw.pendingRemovals) ? raw.pendingRemovals.map(normalizeConfigEntry) : [],
    plugins: raw.plugins !== null && typeof raw.plugins === 'object' ? raw.plugins as Record<string, PluginState> : {},
  }
}

function normalizeConfigEntry(value: unknown): PluginEntry {
  return normalizeConfig({ schemaVersion: 1, plugins: [value] }).plugins[0]!
}

async function defaultFetch(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
