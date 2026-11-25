import { type PluginEntry, type PluginsFile, type PluginState, type StateFile } from '../shared/types.ts';
export declare class ConfigStore {
    config: PluginsFile;
    state: StateFile;
    defaultsError?: string;
    initialize(fetchDefault?: (url: string) => Promise<unknown>): Promise<PluginEntry[]>;
    replace(nextValue: unknown): PluginEntry[];
    upsert(entry: PluginEntry, originalId?: string): PluginEntry[];
    remove(id: string): PluginEntry | null;
    setEnabled(id: string, enabled: boolean): PluginEntry;
    setPackage(id: string, packageName: string): void;
    require(id: string): PluginEntry;
    setPluginState(id: string, state: PluginState): void;
    completeRemoval(id: string): void;
    private trackRemovals;
    private commit;
    private saveState;
}
