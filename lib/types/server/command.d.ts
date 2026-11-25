export interface CommandResult {
    code: number | null;
    output: string;
}
export declare function runPluginCommand(profile: string, action: 'add' | 'remove', target: string, onOutput: (line: string) => void): Promise<CommandResult>;
