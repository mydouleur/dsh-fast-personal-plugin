import { API_PREFIX, type ManagerSnapshot } from '../shared/types.ts'

let snapshot: ManagerSnapshot = {
  ready: false,
  checking: false,
  profile: '',
  configPath: '',
  config: { schemaVersion: 1, plugins: [] },
  plugins: [],
  tasks: [],
}
let listeners = new Set<() => void>()
let refreshing: Promise<void> | null = null

export function getSnapshot(): ManagerSnapshot {
  return snapshot
}

export function getAttention(): boolean {
  return snapshot.plugins.some((plugin) => plugin.attention)
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function startStore(): () => void {
  void refresh()
  const timer = setInterval(() => void refresh(), 2000)
  return () => clearInterval(timer)
}

export async function refresh(): Promise<void> {
  if (refreshing !== null) return refreshing
  refreshing = (async () => {
    try {
      const response = await fetch(`${API_PREFIX}/state`, { cache: 'no-store' })
      if (!response.ok) return
      const next = await response.json() as ManagerSnapshot
      snapshot = next
      for (const listener of listeners) listener()
    } catch { /* retain the last usable snapshot while the host restarts */ }
  })()
  try {
    await refreshing
  } finally {
    refreshing = null
  }
}

export async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_PREFIX}/${path}`, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  await refresh()
  return data
}
