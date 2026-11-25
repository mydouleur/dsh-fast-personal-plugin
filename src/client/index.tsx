import { useSyncExternalStore } from 'react'
import { PLUGIN_ID } from '../shared/types.ts'
import { App } from './App.tsx'
import { getAttention, startStore, subscribe } from './store.ts'

export const name = PLUGIN_ID
export const inject = ['slots']

interface ClientContext {
  effect(callback: () => () => void, label?: string): void
  slots: {
    inject(name: string, callback: () => unknown): void
    register(options: Record<string, unknown>, component: (props: never) => unknown): unknown
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(startStore, `${PLUGIN_ID}: state`)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PLUGIN_ID,
    order: 55,
    label: () => '个人插件',
  }, App as never))
  ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
    name: 'settings.section.icon',
    id: PLUGIN_ID,
  }, SectionIcon as never))
}

function SectionIcon({ size = 18 }: { size?: number }) {
  const attention = useSyncExternalStore(subscribe, getAttention)
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label={attention ? '个人插件，有需要处理的项目' : '个人插件'}>
      <path d="M10 2.2 16 5.5v7L10 16l-6-3.5v-7L10 2.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m4.4 5.7 5.6 3.2 5.6-3.2M10 8.9v6.4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {attention && <circle cx="15.8" cy="4.3" r="3.3" fill="#e5484d" stroke="var(--dsw-alias-bg-layer-1, #fff)" strokeWidth="1.2" />}
    </svg>
  )
}
