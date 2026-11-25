export async function mountPackage(loader, packageName) {
    if (loader === undefined)
        return false;
    try {
        for (const entry of loader.entries()) {
            if (packageMatches(entry.options.name, packageName) && entry.options.disabled !== true)
                return true;
        }
        const id = await loader.create({ name: packageName });
        const entry = loader.resolve(id);
        return entry?.fiber !== undefined && entry.fiber !== null && entry.options?.disabled !== true;
    }
    catch {
        return false;
    }
}
export async function disablePackage(loader, packageName) {
    if (loader === undefined)
        return false;
    let found = false;
    try {
        for (const entry of Array.from(loader.entries())) {
            if (!packageMatches(entry.options.name, packageName))
                continue;
            found = true;
            await entry.update({ disabled: true }, false, true);
        }
        return found;
    }
    catch {
        return false;
    }
}
function packageMatches(entryName, packageName) {
    if (entryName === undefined)
        return false;
    const normalize = (value) => value.trim().replace(/^@+/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const full = normalize(packageName);
    const short = normalize(packageName.replace(/^@[^/]+\//, ''));
    const candidate = normalize(entryName);
    return candidate === full || candidate === short || candidate.endsWith(`-${short}`)
        || entryName.toLowerCase().startsWith(`${packageName.toLowerCase()}/`);
}
