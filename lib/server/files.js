import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { PLUGIN_ID } from '../shared/types.js';
export function dshHome() {
    return process.env.DSH_HOME ?? join(homedir(), '.dsh');
}
export function profileDirectory(profile) {
    return join(dshHome(), 'profiles', profile);
}
export function configDirectory() {
    return join(dshHome(), PLUGIN_ID);
}
export function configPath() {
    return join(configDirectory(), 'plugins.json');
}
export function statePath() {
    return join(configDirectory(), 'state.json');
}
export function readJsonFile(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
    }
    catch {
        return null;
    }
}
export function writeJsonFile(path, value) {
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    renameSync(temporary, path);
}
