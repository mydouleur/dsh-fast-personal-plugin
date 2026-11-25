import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import { defineConfig } from 'tsdown'
import { transform } from 'lightningcss'
import { PLUGIN_ID } from './src/shared/types.ts'

const externals = ['react', 'react/jsx-runtime']
const cssPrefix = '\0dsh-css:'
const cssSuffix = '.mjs'

export default defineConfig({
  entry: { client: 'src/client/index.tsx' },
  outDir: 'client',
  format: 'cjs',
  platform: 'neutral',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: externals,
    alwaysBundle: (source: string) => externals.includes(source) ? undefined : true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env': JSON.stringify({ MODE: 'production' }),
  },
  plugins: [{
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const absolute = importer === undefined ? source : resolvePath(dirname(importer), source)
      return `${cssPrefix}${absolute}${cssSuffix}`
    },
    async load(this: { addWatchFile(file: string): void }, id: string) {
      if (!id.startsWith(cssPrefix)) return null
      const file = id.slice(cssPrefix.length, -cssSuffix.length)
      this.addWatchFile(file)
      const { code, exports: cssExports } = transform({
        filename: file,
        code: await readFile(file),
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classes: Record<string, string> = {}
      for (const [local, exported] of Object.entries(cssExports ?? {})) classes[local] = exported.name
      const tagId = `${PLUGIN_ID}/${basename(file)}`
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
        '  const tag = document.createElement("style");',
        `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classes)};`,
      ].join('\n')
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
