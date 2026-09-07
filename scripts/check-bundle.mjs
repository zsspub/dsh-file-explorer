/** Verify the emitted browser factory only imports DSH platform modules. */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const bundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const allowed = new Set(['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'])
for (const match of bundle.matchAll(/require\("([^"]+)"\)/g)) {
  assert(allowed.has(match[1]), `Unsupported browser import: ${match[1]}`)
}
assert(bundle.includes('window.__ModuleLoader__.load'), 'Missing DSH ModuleLoader factory')
assert(!/require\("node:/.test(bundle), 'Node dependency in browser bundle')
console.log('Browser bundle platform imports verified')
