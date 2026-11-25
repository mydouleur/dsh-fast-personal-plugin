import { CONFIG_SCHEMA_URL, SELF_PACKAGE, SELF_REPO } from '../shared/types.js';
const PACKAGE_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const REPO_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
export function validPackageName(value) {
    return PACKAGE_RE.test(value);
}
export function githubRepoOf(value) {
    if (typeof value !== 'string')
        return null;
    const input = value.trim();
    if (REPO_RE.test(input))
        return input;
    const patterns = [
        /^github:([^/]+)\/([^/]+?)(?:\.git)?(?:#.*)?$/i,
        /^(?:git\+)?https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:[?#].*)?$/i,
        /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?(?:[?#].*)?$/i,
        /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/[^/]+\/[^/]+\.tgz$/i,
        /^https:\/\/codeload\.github\.com\/([^/]+)\/([^/]+)\/tar\.gz\//i,
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(input);
        if (match === null)
            continue;
        const repo = `${match[1]}/${match[2]}`;
        if (REPO_RE.test(repo))
            return repo;
    }
    return null;
}
export function entryId(source) {
    return source.type === 'npm'
        ? `npm:${source.package.toLowerCase()}`
        : `github:${source.repo.toLowerCase()}`;
}
export function isSelfPackage(name) {
    return name.toLowerCase() === SELF_PACKAGE;
}
export function isSelfEntry(entry) {
    return (entry.source.type === 'npm' && isSelfPackage(entry.source.package))
        || (entry.source.type === 'github' && entry.source.repo.toLowerCase() === SELF_REPO)
        || (entry.package !== undefined && isSelfPackage(entry.package));
}
export function normalizeSource(value) {
    if (value === null || typeof value !== 'object')
        throw new Error('plugin source must be an object');
    const source = value;
    if (source.type === 'npm') {
        if (typeof source.package !== 'string' || !validPackageName(source.package))
            throw new Error('invalid npm package name');
        return { type: 'npm', package: source.package };
    }
    if (source.type === 'github') {
        const repo = githubRepoOf(source.repo);
        if (repo === null || !REPO_RE.test(repo))
            throw new Error('invalid GitHub repository');
        const installMode = source.installMode;
        if (installMode !== undefined && installMode !== 'auto' && installMode !== 'asset' && installMode !== 'source') {
            throw new Error('invalid GitHub install mode');
        }
        if (source.asset !== undefined && (typeof source.asset !== 'string' || !/^[A-Za-z0-9._+-]+\.tgz$/.test(source.asset))) {
            throw new Error('GitHub asset must be a .tgz filename');
        }
        if (installMode === 'source' && source.asset !== undefined)
            throw new Error('source mode cannot specify an asset');
        return {
            type: 'github',
            repo,
            ...(installMode === undefined ? {} : { installMode }),
            ...(typeof source.asset === 'string' ? { asset: source.asset } : {}),
        };
    }
    throw new Error('plugin source must be npm or github');
}
export function normalizeEntry(value) {
    if (value === null || typeof value !== 'object')
        throw new Error('plugin entry must be an object');
    const raw = value;
    const source = normalizeSource(raw.source);
    if (raw.enabled !== undefined && typeof raw.enabled !== 'boolean')
        throw new Error('enabled must be a boolean');
    if (raw.package !== undefined && (typeof raw.package !== 'string' || !validPackageName(raw.package))) {
        throw new Error('invalid installed package name');
    }
    const expectedId = entryId(source);
    if (raw.id !== undefined && raw.id !== expectedId)
        throw new Error(`plugin id must be ${expectedId}`);
    return {
        id: expectedId,
        source,
        enabled: raw.enabled !== false,
        ...(typeof raw.package === 'string' ? { package: raw.package } : {}),
    };
}
export function normalizeConfig(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        throw new Error('config must be an object');
    const raw = value;
    if (raw.schemaVersion !== 1)
        throw new Error('unsupported schemaVersion');
    if (!Array.isArray(raw.plugins))
        throw new Error('plugins must be an array');
    const plugins = raw.plugins.map(normalizeEntry);
    const ids = new Set();
    for (const plugin of plugins) {
        if (ids.has(plugin.id))
            throw new Error(`duplicate plugin: ${plugin.id}`);
        ids.add(plugin.id);
    }
    return { $schema: CONFIG_SCHEMA_URL, schemaVersion: 1, plugins };
}
export function emptyConfig() {
    return { $schema: CONFIG_SCHEMA_URL, schemaVersion: 1, plugins: [] };
}
