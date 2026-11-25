import { type WebServerService } from './server/http.ts';
import type { LoaderHandle } from './server/loader.ts';
export declare const name = "dsh-fast-personal-plugin";
interface HostContext {
    webServer: WebServerService;
    loader?: LoaderHandle;
    inject(services: string[], callback: (host: HostContext) => void): void;
    effect(callback: () => () => void, label?: string): void;
}
export declare function apply(ctx: HostContext): void;
export {};
