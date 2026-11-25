export declare function dshHome(): string;
export declare function profileDirectory(profile: string): string;
export declare function configDirectory(): string;
export declare function configPath(): string;
export declare function statePath(): string;
export declare function readJsonFile<T>(path: string): T | null;
export declare function writeJsonFile(path: string, value: unknown): void;
