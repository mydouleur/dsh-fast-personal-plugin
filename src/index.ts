import { PLUGIN_ID } from './shared/types.ts'
import { mountRoutes, type WebServerService } from './server/http.ts'
import { PluginManager } from './server/manager.ts'
import { profileFromArgv } from './server/profile.ts'
import type { LoaderHandle } from './server/loader.ts'

export const name = PLUGIN_ID

interface HostContext {
  webServer: WebServerService
  loader?: LoaderHandle
  inject(services: string[], callback: (host: HostContext) => void): void
  effect(callback: () => () => void, label?: string): void
}

export function apply(ctx: HostContext): void {
  const profile = profileFromArgv(process.argv)
  ctx.inject(['webServer'], (host) => {
    const manager = new PluginManager(profile, host.loader)
    const disposeRoutes = mountRoutes(host.webServer, manager)
    host.effect(() => () => {
      manager.dispose()
      disposeRoutes()
    }, `${PLUGIN_ID}: routes`)
    void manager.start()
  })
}
