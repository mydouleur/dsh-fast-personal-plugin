import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { githubRepoOf } from './identity.js';
export function readLockfileCommits(profileDirectory) {
    const commits = new Map();
    let root;
    try {
        root = parse(readFileSync(join(profileDirectory, 'pnpm-lock.yaml'), 'utf8'));
    }
    catch {
        return commits;
    }
    const visit = (value, key = '') => {
        if (value === null || typeof value !== 'object' || Array.isArray(value))
            return;
        const record = value;
        const resolution = objectRecord(record.resolution);
        const identities = [key, record.specifier, resolution?.repo, resolution?.tarball]
            .filter((part) => typeof part === 'string');
        const repo = identities.map(githubRepoOf).find((value) => value !== null) ?? null;
        const commit = commitOf(resolution) ?? commitOf(record);
        if (repo !== null && commit !== null)
            commits.set(repo.toLowerCase(), commit);
        for (const [childKey, child] of Object.entries(record)) {
            if (childKey !== 'resolution')
                visit(child, childKey);
        }
    };
    visit(root);
    return commits;
}
function objectRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}
function commitOf(record) {
    if (record === undefined)
        return null;
    if (typeof record.commit === 'string' && /^[0-9a-f]{40}$/i.test(record.commit))
        return record.commit;
    if (typeof record.tarball === 'string') {
        const match = /\/tar\.gz\/(?:refs\/(?:heads|tags)\/)?([0-9a-f]{40})(?:$|[?#])/i.exec(record.tarball);
        if (match?.[1] !== undefined)
            return match[1];
    }
    return null;
}
