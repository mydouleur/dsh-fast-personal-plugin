import { runPluginCommand } from './command.js';
import { configPath } from './files.js';
import { isSelfEntry, normalizeEntry } from './identity.js';
import { disablePackage, mountPackage } from './loader.js';
import { entryForInstalled, installedForEntry, scanInstalled, setBundleEnabled } from './profile.js';
import { ConfigStore } from './store.js';
import { checkForUpdate, resolveInstallTarget } from './updates.js';
export class PluginManager {
    profile;
    loader;
    store = new ConfigStore();
    ready = false;
    checking = false;
    tasks = [];
    queue = [];
    running = false;
    nextTaskId = 1;
    disposed = false;
    constructor(profile, loader) {
        this.profile = profile;
        this.loader = loader;
    }
    async start() {
        try {
            const pending = await this.store.initialize();
            this.discoverInstalled();
            this.ready = true;
            for (const entry of pending)
                this.enqueueRemoval(entry);
            void this.checkUpdates();
        }
        catch (error) {
            this.store.defaultsError = `初始化失败：${errorMessage(error)}`;
            this.ready = true;
        }
    }
    snapshot() {
        const installed = scanInstalled(this.profile);
        const activeTasks = new Map(this.tasks.filter((item) => item.task.status === 'pending' || item.task.status === 'running')
            .map((item) => [item.task.pluginId, item.task.id]));
        return {
            ready: this.ready,
            checking: this.checking,
            profile: this.profile,
            configPath: configPath(),
            defaultsError: this.store.defaultsError,
            config: this.store.config,
            plugins: this.store.config.plugins.map((entry) => {
                const current = installedForEntry(entry, installed);
                const state = this.store.state.plugins[entry.id] ?? { status: 'idle' };
                return {
                    entry,
                    installed: current,
                    state,
                    attention: entry.enabled && (current === null || state.status === 'update'),
                    isSelf: isSelfEntry(entry),
                    ...(activeTasks.has(entry.id) ? { taskId: activeTasks.get(entry.id) } : {}),
                };
            }),
            tasks: this.tasks.map((item) => item.task),
        };
    }
    async checkUpdates() {
        if (this.checking || !this.ready)
            return;
        this.checking = true;
        try {
            this.discoverInstalled();
            const installed = scanInstalled(this.profile);
            const entries = this.store.config.plugins.filter((entry) => entry.enabled && installedForEntry(entry, installed) !== null);
            let cursor = 0;
            const worker = async () => {
                while (cursor < entries.length && !this.disposed) {
                    const entry = entries[cursor++];
                    const current = installedForEntry(entry, installed);
                    const previous = this.store.state.plugins[entry.id];
                    this.store.setPluginState(entry.id, { ...previous, status: 'checking', error: undefined });
                    try {
                        const state = await checkForUpdate(entry, current, previous?.installedCommit);
                        this.store.setPluginState(entry.id, state);
                    }
                    catch (error) {
                        this.store.setPluginState(entry.id, {
                            ...previous,
                            status: 'error',
                            lastCheckedAt: new Date().toISOString(),
                            error: errorMessage(error),
                        });
                    }
                }
            };
            await Promise.all(Array.from({ length: Math.min(3, entries.length) }, worker));
        }
        finally {
            this.checking = false;
        }
    }
    install(id) {
        const entry = this.store.require(id);
        const installed = installedForEntry(entry, scanInstalled(this.profile));
        return this.enqueue(entry, installed === null ? 'install' : 'update');
    }
    remove(id) {
        const entry = this.store.remove(id);
        if (entry === null)
            throw new Error('插件不在清单中');
        return this.enqueueRemoval(entry);
    }
    toggle(id, enabled) {
        if (isSelfEntry(this.store.require(id)) && !enabled)
            throw new Error('插件管理器不能停用自身');
        const entry = this.store.setEnabled(id, enabled);
        return this.enqueue(entry, 'toggle', enabled);
    }
    saveEntry(value, originalId) {
        const entry = normalizeEntry(value);
        const removed = this.store.upsert(entry, originalId);
        for (const item of removed)
            this.enqueueRemoval(item);
        this.discoverInstalled();
    }
    replaceConfig(value) {
        const removed = this.store.replace(value);
        for (const entry of removed)
            this.enqueueRemoval(entry);
        this.discoverInstalled();
    }
    async importDefaults() {
        const imported = await this.store.importDefaults();
        this.discoverInstalled();
        return imported;
    }
    exportConfig() {
        return this.store.config;
    }
    dispose() {
        this.disposed = true;
    }
    discoverInstalled() {
        const pending = new Set(this.store.state.pendingRemovals.map((entry) => entry.id));
        for (const installed of Object.values(scanInstalled(this.profile))) {
            const discovered = entryForInstalled(installed);
            if (pending.has(discovered.id))
                continue;
            const existing = this.store.config.plugins.find((entry) => entry.id === discovered.id);
            if (existing === undefined)
                this.store.upsert(discovered);
            else if (existing.package !== discovered.package)
                this.store.setPackage(existing.id, installed.package);
        }
    }
    enqueueRemoval(entry) {
        if (isSelfEntry(entry))
            throw new Error('插件管理器不能卸载自身');
        return this.enqueue(entry, 'remove');
    }
    enqueue(entry, action, enabled) {
        const duplicate = action === 'remove' ? undefined : this.queue.find((item) => item.task.pluginId === entry.id
            && (item.task.status === 'pending' || item.task.status === 'running'));
        if (duplicate !== undefined)
            return duplicate.task;
        const task = {
            id: this.nextTaskId++,
            pluginId: entry.id,
            action,
            status: 'pending',
            output: [],
            needsRestart: false,
            startedAt: new Date().toISOString(),
        };
        const internal = { task, entry, ...(enabled === undefined ? {} : { enabled }) };
        this.tasks.unshift(internal);
        if (this.tasks.length > 30)
            this.tasks.length = 30;
        this.queue.push(internal);
        void this.pump();
        return task;
    }
    async pump() {
        if (this.running || this.disposed)
            return;
        const next = this.queue.shift();
        if (next === undefined)
            return;
        this.running = true;
        next.task.status = 'running';
        try {
            await this.execute(next);
            next.task.status = 'done';
        }
        catch (error) {
            next.task.status = 'failed';
            next.task.error = errorMessage(error);
            next.task.output.push(next.task.error);
        }
        finally {
            next.task.finishedAt = new Date().toISOString();
            this.running = false;
            void this.pump();
        }
    }
    async execute(internal) {
        const { task, entry } = internal;
        if (task.action === 'remove') {
            if (isSelfEntry(entry))
                throw new Error('插件管理器不能卸载自身');
            const installed = installedForEntry(entry, scanInstalled(this.profile));
            if (installed === null) {
                this.store.completeRemoval(entry.id);
                task.output.push('插件未安装，已从清单删除');
                return;
            }
            const result = await runPluginCommand(this.profile, 'remove', installed.package, (line) => this.log(task, line));
            if (result.code !== 0)
                throw new Error(commandError(result.output));
            const live = await disablePackage(this.loader, installed.package);
            task.needsRestart = !live;
            this.store.completeRemoval(entry.id);
            task.output.push('卸载完成');
            return;
        }
        if (task.action === 'toggle') {
            const enabled = internal.enabled === true;
            const installed = installedForEntry(entry, scanInstalled(this.profile));
            if (installed !== null) {
                setBundleEnabled(this.profile, installed.package, enabled);
                if (enabled)
                    task.needsRestart = !(await mountPackage(this.loader, installed.package));
                else
                    task.needsRestart = !(await disablePackage(this.loader, installed.package));
            }
            task.output.push(enabled ? '已启用，刷新页面后生效' : '已停用，刷新页面后生效');
            return;
        }
        const previous = this.store.state.plugins[entry.id];
        const resolution = await resolveInstallTarget(entry, previous);
        this.log(task, `安装目标：${resolution.target}`);
        const result = await runPluginCommand(this.profile, 'add', resolution.target, (line) => this.log(task, line));
        if (result.code !== 0)
            throw new Error(commandError(result.output));
        const installed = installedForEntry(entry, scanInstalled(this.profile));
        if (installed === null)
            throw new Error('安装命令已结束，但没有在当前 profile 中找到对应 DSH bundle');
        this.store.setPackage(entry.id, installed.package);
        this.store.setPluginState(entry.id, {
            status: 'latest',
            ...(resolution.latestVersion === undefined ? {} : { latestVersion: resolution.latestVersion }),
            ...(resolution.remoteCommit === undefined ? {} : { remoteCommit: resolution.remoteCommit }),
            ...(resolution.remoteCommit === undefined ? {} : { installedCommit: installed.commit ?? resolution.remoteCommit }),
            ...(resolution.ref === undefined ? {} : { ref: resolution.ref }),
            lastCheckedAt: new Date().toISOString(),
        });
        task.needsRestart = task.action === 'update' || !(await mountPackage(this.loader, installed.package));
        task.output.push(task.needsRestart ? '安装完成，重启 DSH 后生效' : '安装完成，刷新页面后生效');
    }
    log(task, line) {
        task.output.push(line);
        if (task.output.length > 200)
            task.output.splice(0, task.output.length - 200);
    }
}
function commandError(output) {
    const lines = output.trim().split(/\r?\n/).filter((line) => line.trim() !== '');
    return lines.slice(-20).join('\n') || 'DSH 插件命令执行失败';
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
