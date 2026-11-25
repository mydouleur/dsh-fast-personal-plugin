import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { profileDirectory } from './files.js';
export async function runPluginCommand(profile, action, target, onOutput) {
    let result = await spawnPluginCommand(profile, action, target, onOutput);
    if (action === 'add' && result.code !== 0 && result.output.includes('ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED')) {
        const key = parseAllowBuildsKey(result.output);
        if (key !== null) {
            addAllowBuildsKey(profile, key);
            onOutput(`允许此 GitHub 插件执行安装构建：${key}`);
            result = await spawnPluginCommand(profile, action, target, onOutput);
        }
    }
    return result;
}
function spawnPluginCommand(profile, action, target, onOutput) {
    const invocation = cliInvocation(profile);
    const args = [...invocation.args, 'plugin', '--profile', profile, action, target];
    return new Promise((resolveResult) => {
        let output = '';
        let timedOut = false;
        let child;
        try {
            child = spawn(invocation.file, args, {
                cwd: invocation.cwd,
                env: { ...process.env, CI: 'true', ...invocation.env },
                shell: invocation.shell,
                detached: process.platform !== 'win32',
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        }
        catch (error) {
            resolveResult({ code: null, output: error instanceof Error ? error.message : String(error) });
            return;
        }
        const collect = (chunk) => {
            const text = chunk.toString('utf8');
            output = `${output}${text}`.slice(-512_000);
            for (const line of text.split(/\r?\n|\r/))
                if (line.trim() !== '')
                    onOutput(line.trimEnd());
        };
        child.stdout?.on('data', collect);
        child.stderr?.on('data', collect);
        const timer = setTimeout(() => {
            timedOut = true;
            stopChild(child);
        }, 5 * 60 * 1000);
        child.once('error', (error) => {
            clearTimeout(timer);
            resolveResult({ code: null, output: `${output}\n${error.message}` });
        });
        child.once('close', (code) => {
            clearTimeout(timer);
            resolveResult({ code: timedOut ? null : code, output: timedOut ? `${output}\n命令执行超时` : output });
        });
    });
}
function cliInvocation(profile) {
    const entry = process.argv[1];
    const cwd = existsSync(profileDirectory(profile)) ? profileDirectory(profile) : process.cwd();
    if (entry !== undefined) {
        const desktop = desktopCliBootstrap(entry);
        if (desktop !== null) {
            return {
                file: process.execPath,
                args: ['--expose-internals', desktop],
                cwd,
                shell: false,
                env: { ELECTRON_RUN_AS_NODE: '1' },
            };
        }
        if (/[\\/](?:bin\.(?:js|ts)|dsh)$/.test(entry)) {
            const absolute = resolve(entry);
            return {
                file: process.execPath,
                args: [...process.execArgv, absolute],
                cwd: dirname(absolute),
                shell: false,
            };
        }
    }
    return {
        file: process.platform === 'win32' ? 'dsh.cmd' : 'dsh',
        args: [],
        cwd,
        shell: false,
    };
}
function desktopCliBootstrap(entry) {
    const marker = /[\\/]app\.asar(?=[\\/]|$)/i.exec(entry);
    const candidates = [];
    if (marker !== null) {
        const root = entry.slice(0, marker.index + marker[0].length);
        candidates.push(join(root, 'lib', 'desktop-cli.js'), join(root, 'dsh', 'lib', 'desktop-cli.js'));
    }
    candidates.push(join(dirname(entry), 'cli.js'));
    return candidates.find(existsSync) ?? null;
}
function stopChild(child) {
    if (process.platform === 'win32' && child.pid !== undefined) {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
        return;
    }
    if (child.pid !== undefined) {
        try {
            process.kill(-child.pid, 'SIGKILL');
            return;
        }
        catch { /* process already exited */ }
    }
    child.kill('SIGKILL');
}
function parseAllowBuildsKey(output) {
    const match = /^[ \t]*(\S+@\S+):[ \t]*true[ \t]*$/m.exec(output);
    return match?.[1]?.trim() ?? null;
}
function addAllowBuildsKey(profile, key) {
    const file = join(profileDirectory(profile), 'pnpm-workspace.yaml');
    let yaml = '';
    try {
        yaml = readFileSync(file, 'utf8');
    }
    catch { /* create a new workspace file */ }
    const safeKey = safeAllowBuildsKey(key);
    const pattern = /^[ \t]*allowBuilds:[^\r\n]*(?:(?:\r?\n)[ \t]{2,}[^\r\n]*)*/gm;
    const entries = new Map();
    for (const match of yaml.matchAll(pattern)) {
        for (const line of match[0].split(/\r?\n/).slice(1)) {
            const item = /^[ \t]+(\S.*?)\s*:\s*(true|false)?\s*$/.exec(line);
            if (item?.[1] !== undefined)
                entries.set(item[1].replace(/^['"]|['"]$/g, ''), item[2] ?? 'true');
        }
    }
    entries.set(safeKey, 'true');
    const eol = yaml.includes('\r\n') ? '\r\n' : '\n';
    const quoted = [...entries].map(([name, value]) => `  ${yamlKey(name)}: ${value}`).join(eol);
    const block = `allowBuilds:${eol}${quoted}${eol}`;
    let replacements = 0;
    const next = yaml.replace(pattern, () => replacements++ === 0 ? block : '');
    const result = replacements === 0 ? `${yaml.replace(/\r?\n?$/, eol)}${block}` : next;
    writeFileSync(file, result, 'utf8');
}
function safeAllowBuildsKey(key) {
    const at = key.startsWith('@') ? key.indexOf('@', 1) : key.indexOf('@');
    if (at <= 0)
        return key;
    const name = key.slice(0, at);
    const spec = key.slice(at + 1);
    if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(spec))
        return key;
    if (spec.startsWith('git+'))
        return `${name}@${spec}`;
    const github = /^https:\/\/codeload\.github\.com\/([^/]+)\/([^/]+)\/tar\.gz\//.exec(spec);
    return github === null ? name : `${name}@git+https://github.com/${github[1]}/${github[2]}.git`;
}
function yamlKey(key) {
    return /^[-?:,[\]{}#&*!|>'"%@`]/.test(key) || /:(\s|$)/.test(key) ? `'${key.replace(/'/g, "''")}'` : key;
}
