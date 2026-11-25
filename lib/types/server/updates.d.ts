import type { InstalledPlugin, PluginEntry, PluginState } from '../shared/types.ts';
export interface GithubRemote {
    commit: string;
    ref: string;
    version?: string;
}
export interface InstallResolution {
    target: string;
    latestVersion?: string;
    remoteCommit?: string;
    ref?: string;
}
export declare function checkForUpdate(entry: PluginEntry, installed: InstalledPlugin, installedCommit?: string): Promise<PluginState>;
export declare function resolveInstallTarget(entry: PluginEntry, cached?: PluginState): Promise<InstallResolution>;
export declare function npmLatestStable(packageName: string): Promise<string>;
export declare function githubRemote(repo: string, requestedRef?: string): Promise<GithubRemote>;
export declare function gitRefOf(spec: string): string | null;
