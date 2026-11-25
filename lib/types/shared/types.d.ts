export declare const PLUGIN_ID = "dsh-fast-personal-plugin";
export declare const SELF_PACKAGE = "dsh-fast-personal-plugin";
export declare const SELF_REPO = "mydouleur/dsh-fast-personal-plugin";
export declare const API_PREFIX = "/dsh-fast-personal-plugin";
export declare const DEFAULT_CONFIG_URL = "https://raw.githubusercontent.com/mydouleur/dsh-fast-personal-plugin/main/plugins.json";
export declare const CONFIG_SCHEMA_URL = "https://raw.githubusercontent.com/mydouleur/dsh-fast-personal-plugin/main/plugins.schema.json";
export interface NpmSource {
    type: 'npm';
    package: string;
}
export interface GithubSource {
    type: 'github';
    repo: string;
    installMode?: 'auto' | 'asset' | 'source';
    asset?: string;
}
export type PluginSource = NpmSource | GithubSource;
export interface PluginEntry {
    id: string;
    source: PluginSource;
    enabled: boolean;
    package?: string;
}
export interface PluginsFile {
    $schema?: string;
    schemaVersion: 1;
    plugins: PluginEntry[];
}
export interface InstalledPlugin {
    package: string;
    version: string;
    spec: string;
    enabled: boolean;
    repository?: string;
}
export type UpdateStatus = 'idle' | 'checking' | 'latest' | 'update' | 'error' | 'no-release';
export interface PluginState {
    status: UpdateStatus;
    latestVersion?: string;
    latestTag?: string;
    releaseUrl?: string;
    lastCheckedAt?: string;
    installedReleaseTag?: string;
    error?: string;
}
export interface PluginView {
    entry: PluginEntry;
    installed: InstalledPlugin | null;
    state: PluginState;
    attention: boolean;
    isSelf: boolean;
    taskId?: number;
}
export type TaskAction = 'install' | 'update' | 'remove' | 'toggle';
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed';
export interface PluginTask {
    id: number;
    pluginId: string;
    action: TaskAction;
    status: TaskStatus;
    output: string[];
    error?: string;
    needsRestart: boolean;
    startedAt: string;
    finishedAt?: string;
}
export interface ManagerSnapshot {
    ready: boolean;
    checking: boolean;
    profile: string;
    configPath: string;
    defaultsError?: string;
    config: PluginsFile;
    plugins: PluginView[];
    tasks: PluginTask[];
}
export interface StateFile {
    schemaVersion: 1;
    previousPlugins: PluginEntry[];
    pendingRemovals: PluginEntry[];
    plugins: Record<string, PluginState>;
}
