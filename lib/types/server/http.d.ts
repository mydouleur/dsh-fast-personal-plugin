import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PluginManager } from './manager.ts';
interface WebRoute {
    kind: 'exact';
    path: string;
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
}
export interface WebServerService {
    register(route: WebRoute): () => void;
}
export declare function mountRoutes(webServer: WebServerService, manager: PluginManager): () => void;
export {};
