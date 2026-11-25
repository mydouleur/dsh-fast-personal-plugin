import { existsSync } from 'node:fs';
import { DEFAULT_CONFIG_URL } from '../shared/types.js';
import { configPath, readJsonFile, statePath, writeJsonFile } from './files.js';
import { emptyConfig, isSelfEntry, normalizeConfig } from './identity.js';
function emptyState() {
    return { schemaVersion: 1, previousPlugins: [], pendingRemovals: [], plugins: {} };
}
export class ConfigStore {
    config = emptyConfig();
    state = emptyState();
    defaultsError;
    async initialize(fetchDefault = defaultFetch) {
        if (!existsSync(configPath())) {
            try {
                this.config = normalizeConfig(await fetchDefault(DEFAULT_CONFIG_URL));
                writeJsonFile(configPath(), this.config);
            }
            catch (error) {
                this.defaultsError = `默认清单下载失败：${errorMessage(error)}`;
                this.config = emptyConfig();
            }
        }
        else {
            this.config = normalizeConfig(readJsonFile(configPath()));
        }
        this.state = normalizeState(readJsonFile(statePath()));
        const previous = this.state.previousPlugins;
        const pending = new Map(this.state.pendingRemovals.filter((entry) => !isSelfEntry(entry)).map((entry) => [entry.id, entry]));
        for (const entry of previous) {
            if (!this.config.plugins.some((candidate) => candidate.id === entry.id))
                pending.set(entry.id, entry);
        }
        let changed = false;
        for (const entry of previous.filter(isSelfEntry)) {
            if (!this.config.plugins.some((candidate) => isSelfEntry(candidate))) {
                this.config.plugins.push(entry);
                changed = true;
            }
            pending.delete(entry.id);
        }
        this.state.previousPlugins = this.config.plugins;
        this.state.pendingRemovals = [...pending.values()];
        if (changed || !existsSync(configPath()))
            writeJsonFile(configPath(), this.config);
        this.saveState();
        return this.state.pendingRemovals;
    }
    replace(nextValue) {
        const next = normalizeConfig(nextValue);
        const removed = this.config.plugins.filter((entry) => !next.plugins.some((candidate) => candidate.id === entry.id));
        for (const entry of this.config.plugins.filter(isSelfEntry)) {
            if (!next.plugins.some((candidate) => isSelfEntry(candidate)))
                next.plugins.push(entry);
        }
        this.config = next;
        this.trackRemovals(removed.filter((entry) => !isSelfEntry(entry)));
        this.commit();
        return removed.filter((entry) => !isSelfEntry(entry));
    }
    upsert(entry, originalId) {
        const next = this.config.plugins.filter((candidate) => candidate.id !== entry.id && candidate.id !== originalId);
        next.push(entry);
        return this.replace({ schemaVersion: 1, plugins: next });
    }
    remove(id) {
        const entry = this.config.plugins.find((candidate) => candidate.id === id);
        if (entry === undefined)
            return null;
        if (isSelfEntry(entry))
            throw new Error('插件管理器不能卸载自身');
        this.replace({ schemaVersion: 1, plugins: this.config.plugins.filter((candidate) => candidate.id !== id) });
        return entry;
    }
    setEnabled(id, enabled) {
        const entry = this.require(id);
        const updated = { ...entry, enabled };
        this.upsert(updated);
        return updated;
    }
    setPackage(id, packageName) {
        const entry = this.require(id);
        if (entry.package === packageName)
            return;
        this.upsert({ ...entry, package: packageName });
    }
    require(id) {
        const entry = this.config.plugins.find((candidate) => candidate.id === id);
        if (entry === undefined)
            throw new Error('插件不在清单中');
        return entry;
    }
    setPluginState(id, state) {
        this.state.plugins[id] = state;
        this.saveState();
    }
    completeRemoval(id) {
        this.state.pendingRemovals = this.state.pendingRemovals.filter((entry) => entry.id !== id);
        delete this.state.plugins[id];
        this.saveState();
    }
    trackRemovals(entries) {
        const pending = new Map(this.state.pendingRemovals.map((entry) => [entry.id, entry]));
        for (const entry of entries)
            pending.set(entry.id, entry);
        this.state.pendingRemovals = [...pending.values()];
    }
    commit() {
        this.state.previousPlugins = this.config.plugins;
        writeJsonFile(configPath(), this.config);
        this.saveState();
    }
    saveState() {
        writeJsonFile(statePath(), this.state);
    }
}
function normalizeState(value) {
    if (value === null || typeof value !== 'object')
        return emptyState();
    const raw = value;
    return {
        schemaVersion: 1,
        previousPlugins: Array.isArray(raw.previousPlugins) ? raw.previousPlugins.map(normalizeConfigEntry) : [],
        pendingRemovals: Array.isArray(raw.pendingRemovals) ? raw.pendingRemovals.map(normalizeConfigEntry) : [],
        plugins: raw.plugins !== null && typeof raw.plugins === 'object' ? raw.plugins : {},
    };
}
function normalizeConfigEntry(value) {
    return normalizeConfig({ schemaVersion: 1, plugins: [value] }).plugins[0];
}
async function defaultFetch(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok)
        throw new Error(`HTTP ${response.status}`);
    return response.json();
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
