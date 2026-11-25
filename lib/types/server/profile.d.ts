import type { InstalledPlugin, PluginEntry } from '../shared/types.ts';
export declare function profileFromArgv(argv: readonly string[], fallback?: string): string;
export declare function scanInstalled(profile: string): Record<string, InstalledPlugin>;
export declare function entryForInstalled(installed: InstalledPlugin): PluginEntry;
export declare function installedForEntry(entry: PluginEntry, installed: Record<string, InstalledPlugin>): InstalledPlugin | null;
export declare function setBundleEnabled(profile: string, packageName: string, enabled: boolean): void;
export declare function packageHasClient(profile: string, packageName: string): boolean;
