import { API_PREFIX } from '../shared/types.js';
export function mountRoutes(webServer, manager) {
    const routes = [
        route('state', 'GET', async (_request, response) => sendJson(response, 200, manager.snapshot())),
        route('export', 'GET', async (_request, response) => {
            response.writeHead(200, {
                'cache-control': 'no-store',
                'content-type': 'application/json; charset=utf-8',
                'content-disposition': 'attachment; filename="dsh-plugins.json"',
            });
            response.end(`${JSON.stringify(manager.exportConfig(), null, 2)}\n`);
        }),
        route('check', 'POST', async (_request, response) => {
            void manager.checkUpdates();
            sendJson(response, 202, { ok: true });
        }),
        route('plugin', 'POST', async (request, response) => {
            const body = await readJsonBody(request);
            manager.saveEntry(field(body, 'entry'), optionalString(body, 'originalId'));
            sendJson(response, 200, manager.snapshot());
        }),
        route('install', 'POST', async (request, response) => {
            const body = await readJsonBody(request);
            const task = manager.install(requiredString(body, 'id'));
            sendJson(response, 202, { task });
        }),
        route('remove', 'POST', async (request, response) => {
            const body = await readJsonBody(request);
            const task = manager.remove(requiredString(body, 'id'));
            sendJson(response, 202, { task });
        }),
        route('toggle', 'POST', async (request, response) => {
            const body = await readJsonBody(request);
            const enabled = field(body, 'enabled');
            if (typeof enabled !== 'boolean')
                throw new Error('enabled must be a boolean');
            const task = manager.toggle(requiredString(body, 'id'), enabled);
            sendJson(response, 202, { task });
        }),
        route('config', 'POST', async (request, response) => {
            const body = await readJsonBody(request);
            manager.replaceConfig(field(body, 'config'));
            sendJson(response, 200, manager.snapshot());
        }),
        route('defaults', 'POST', async (_request, response) => {
            const imported = await manager.importDefaults();
            sendJson(response, 200, { imported, snapshot: manager.snapshot() });
        }),
    ];
    const disposers = routes.map((item) => webServer.register(item));
    return () => { for (const dispose of disposers)
        dispose(); };
    function route(path, method, handler) {
        return {
            kind: 'exact',
            path: `${API_PREFIX}/${path}`,
            handler: async (request, response) => {
                if (request.method !== method) {
                    response.writeHead(405, { allow: method });
                    response.end();
                    return;
                }
                if (method === 'POST' && !isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    await handler(request, response);
                }
                catch (error) {
                    sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        };
    }
}
function isSameOrigin(request) {
    const host = loopbackAuthority(request.headers.host);
    if (host === null)
        return false;
    const origin = request.headers.origin;
    if (origin === undefined || origin === '')
        return true;
    try {
        const url = new URL(origin);
        return url.protocol === 'dsh-app:' || loopbackAuthority(url.host) === host;
    }
    catch {
        return false;
    }
}
function loopbackAuthority(authority) {
    if (authority === undefined)
        return null;
    try {
        const url = new URL(`http://${authority}`);
        if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase()))
            return null;
        return `loopback:${url.port === '' ? '80' : url.port}`;
    }
    catch {
        return null;
    }
}
async function readJsonBody(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > 1024 * 1024)
            throw new Error('request body too large');
        chunks.push(buffer);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        throw new Error('request body must be an object');
    return value;
}
function field(body, name) {
    return body[name];
}
function requiredString(body, name) {
    const value = body[name];
    if (typeof value !== 'string' || value === '')
        throw new Error(`${name} is required`);
    return value;
}
function optionalString(body, name) {
    const value = body[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
}
function sendJson(response, status, value) {
    response.writeHead(status, { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
}
