import type { InstalledPlugin, PluginEntry, PluginState } from '../shared/types.ts';
export interface GithubAsset {
    name: string;
    browser_download_url: string;
}
export interface GithubRelease {
    tag_name: string;
    html_url: string;
    draft: boolean;
    prerelease: boolean;
    assets: GithubAsset[];
}
export interface InstallResolution {
    target: string;
    latestVersion: string;
    latestTag?: string;
    releaseUrl?: string;
}
export declare function checkForUpdate(entry: PluginEntry, installed: InstalledPlugin, installedReleaseTag?: string): Promise<PluginState>;
export declare function resolveInstallTarget(entry: PluginEntry, cached?: PluginState): Promise<InstallResolution>;
export declare function npmLatestStable(packageName: string): Promise<string>;
export declare function githubLatestRelease(repo: string): Promise<GithubRelease>;
export declare function githubHasUpdate(latestTag: string, installed: InstalledPlugin, installedReleaseTag?: string): boolean;
export declare function normalizeVersion(version: string): string;
export declare function gitRefOf(spec: string): string | null;
