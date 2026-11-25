export interface LoaderHandle {
  entries(): Iterable<{
    id: string
    options: { id?: string; name?: string; disabled?: boolean | null }
    update(options: { disabled: boolean | null }, create?: boolean, force?: boolean): Promise<void>
  }>
  create(options: { id?: string; name: string }): Promise<string>
  resolve(id: string): { fiber?: unknown; options?: { disabled?: boolean | null } }
}

export async function mountPackage(loader: LoaderHandle | undefined, packageName: string): Promise<boolean> {
  if (loader === undefined) return false
  try {
    for (const entry of loader.entries()) {
      if (packageMatches(entry.options.name, packageName) && entry.options.disabled !== true) return true
    }
    const id = await loader.create({ name: packageName })
    const entry = loader.resolve(id)
    return entry?.fiber !== undefined && entry.fiber !== null && entry.options?.disabled !== true
  } catch {
    return false
  }
}

export async function disablePackage(loader: LoaderHandle | undefined, packageName: string): Promise<boolean> {
  if (loader === undefined) return false
  let found = false
  try {
    for (const entry of Array.from(loader.entries())) {
      if (!packageMatches(entry.options.name, packageName)) continue
      found = true
      await entry.update({ disabled: true }, false, true)
    }
    return found
  } catch {
    return false
  }
}

function packageMatches(entryName: string | undefined, packageName: string): boolean {
  if (entryName === undefined) return false
  const normalize = (value: string) => value.trim().replace(/^@+/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const full = normalize(packageName)
  const short = normalize(packageName.replace(/^@[^/]+\//, ''))
  const candidate = normalize(entryName)
  return candidate === full || candidate === short || candidate.endsWith(`-${short}`)
    || entryName.toLowerCase().startsWith(`${packageName.toLowerCase()}/`)
}
