import { gt, prerelease, rcompare, valid } from 'semver';
export async function checkForUpdate(entry, installed, installedReleaseTag) {
    const checkedAt = new Date().toISOString();
    if (entry.source.type === 'npm') {
        const latestVersion = await npmLatestStable(entry.source.package);
        return {
            status: isNewer(latestVersion, installed.version) ? 'update' : 'latest',
            latestVersion,
            lastCheckedAt: checkedAt,
        };
    }
    const release = await githubLatestRelease(entry.source.repo);
    const latestVersion = normalizeVersion(release.tag_name);
    return {
        status: githubHasUpdate(release.tag_name, installed, installedReleaseTag) ? 'update' : 'latest',
        latestVersion,
        latestTag: release.tag_name,
        releaseUrl: release.html_url,
        lastCheckedAt: checkedAt,
    };
}
export async function resolveInstallTarget(entry, cached) {
    if (entry.source.type === 'npm') {
        const latestVersion = cached?.latestVersion ?? await npmLatestStable(entry.source.package);
        return { target: `${entry.source.package}@${latestVersion}`, latestVersion };
    }
    const source = entry.source;
    const release = await githubLatestRelease(source.repo);
    const latestVersion = normalizeVersion(release.tag_name);
    const mode = source.installMode ?? 'auto';
    const tarballs = release.assets.filter((asset) => /^[A-Za-z0-9._+-]+\.tgz$/.test(asset.name));
    const selected = mode === 'source'
        ? undefined
        : source.asset !== undefined
            ? tarballs.find((asset) => asset.name === source.asset)
            : tarballs.length === 1 ? tarballs[0] : undefined;
    if (mode === 'asset' && selected === undefined) {
        throw new Error(source.asset === undefined
            ? '最新 Release 没有可唯一确定的 .tgz 资产，请在清单中指定 asset'
            : `最新 Release 中找不到资产 ${source.asset}`);
    }
    if (!/^[A-Za-z0-9._+-]+$/.test(release.tag_name))
        throw new Error('Release 标签包含不支持的字符');
    return {
        target: selected?.browser_download_url ?? `git+https://github.com/${source.repo}.git#${release.tag_name}`,
        latestVersion,
        latestTag: release.tag_name,
        releaseUrl: release.html_url,
    };
}
export async function npmLatestStable(packageName) {
    const path = packageName.startsWith('@') ? `@${encodeURIComponent(packageName.slice(1))}` : encodeURIComponent(packageName);
    const metadata = await fetchJson(`https://registry.npmjs.org/${path}`, {
        accept: 'application/vnd.npm.install-v1+json',
    });
    const latest = metadata['dist-tags']?.latest;
    if (latest !== undefined && valid(latest) !== null && prerelease(latest) === null)
        return latest;
    const stable = Object.keys(metadata.versions ?? {}).filter((version) => valid(version) !== null && prerelease(version) === null);
    if (stable.length === 0) {
        if (latest !== undefined && valid(latest) !== null)
            return latest;
        throw new Error('npm 包没有可用版本');
    }
    stable.sort(rcompare);
    return stable[0];
}
export async function githubLatestRelease(repo) {
    const release = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`, {
        accept: 'application/vnd.github+json',
        'user-agent': 'dsh-fast-personal-plugin',
        'x-github-api-version': '2022-11-28',
    });
    if (release.draft || release.prerelease || typeof release.tag_name !== 'string' || !Array.isArray(release.assets)) {
        throw new Error('GitHub 返回了无效的 Release 信息');
    }
    return release;
}
export function githubHasUpdate(latestTag, installed, installedReleaseTag) {
    if (installedReleaseTag !== undefined)
        return installedReleaseTag !== latestTag;
    const ref = gitRefOf(installed.spec);
    if (ref !== null && !/^[0-9a-f]{40}$/i.test(ref))
        return ref !== latestTag && ref !== `v${latestTag.replace(/^v/, '')}`;
    const latest = valid(normalizeVersion(latestTag));
    const current = valid(installed.version);
    if (latest !== null && current !== null)
        return gt(latest, current);
    return installed.spec.includes('#') ? ref !== latestTag : true;
}
export function normalizeVersion(version) {
    return version.trim().replace(/^v(?=\d)/i, '');
}
export function gitRefOf(spec) {
    const index = spec.lastIndexOf('#');
    return index < 0 ? null : spec.slice(index + 1);
}
async function fetchJson(url, headers) {
    const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
        redirect: 'follow',
    });
    if (response.status === 404 && url.includes('/releases/latest')) {
        const error = new Error('该 GitHub 仓库没有正式 Release');
        error.code = 'NO_RELEASE';
        throw error;
    }
    if (!response.ok)
        throw new Error(`${new URL(url).hostname} 返回 HTTP ${response.status}`);
    return await response.json();
}
function isNewer(latest, current) {
    if (valid(latest) !== null && valid(current) !== null)
        return gt(latest, current);
    return latest !== current;
}
