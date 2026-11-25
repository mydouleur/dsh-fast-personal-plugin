import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { PLUGIN_ID } from '../shared/types.ts'

export function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

export function profileDirectory(profile: string): string {
  return join(dshHome(), 'profiles', profile)
}

export function configDirectory(): string {
  return join(dshHome(), PLUGIN_ID)
}

export function configPath(): string {
  return join(configDirectory(), 'plugins.json')
}

export function statePath(): string {
  return join(configDirectory(), 'state.json')
}

export function readJsonFile<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')) as T
  } catch {
    return null
  }
}

export function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  renameSync(temporary, path)
}
