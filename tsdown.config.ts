/** Browser bundle using DSH ModuleLoader and its shared platform modules. */
import { dirname, join } from 'node:path'
import type { UserConfig } from 'tsdown'

/** Package id stamped into the loader handoff; must equal the package name. */
const ID = 'dsh-file-explorer'

/**
 * The host's frozen module-table specifiers (mirrors `PLATFORM_MODULES` in
 * `@deepseek-ai/dsh-client-web`). A `require()` the table cannot answer throws
 * at runtime, so exactly these stay external and everything else is bundled.
 */
const PLATFORM_MODULES: ReadonlySet<string> = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
])

const config: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: true,
  clean: false,
  loader: { '.png': 'dataurl', '.svg': 'dataurl' },
  plugins: [
    {
      name: 'vfile-browser-imports',
      resolveId(source, importer) {
        if (
          importer &&
          /[/\\]vfile[/\\]lib[/\\]/.test(importer) &&
          ['#minproc', '#minpath', '#minurl'].includes(source)
        ) {
          return join(dirname(importer), source.slice(1) + '.browser.js')
        }
        return null
      },
    },
  ],
  inputOptions: {
    // Prefer tree-shakeable ESM icons even though the host loader consumes CJS.
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      conditionNames: ['browser', 'import', 'module', 'default'],
    },
  },
  deps: {
    onlyBundle: false,
    neverBundle: (specifier: string) => PLATFORM_MODULES.has(specifier),
    alwaysBundle: (specifier: string) => !PLATFORM_MODULES.has(specifier),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
}

export default config
