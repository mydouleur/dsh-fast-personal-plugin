import { PLUGIN_ID } from './shared/types.js';
import { mountRoutes } from './server/http.js';
import { PluginManager } from './server/manager.js';
import { profileFromArgv } from './server/profile.js';
export const name = PLUGIN_ID;
export function apply(ctx) {
    const profile = profileFromArgv(process.argv);
    ctx.inject(['webServer'], (host) => {
        const manager = new PluginManager(profile, host.loader);
        const disposeRoutes = mountRoutes(host.webServer, manager);
        host.effect(() => () => {
            manager.dispose();
            disposeRoutes();
        }, `${PLUGIN_ID}: routes`);
        void manager.start();
    });
}
