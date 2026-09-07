import { Context } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import type * as Gateway from '@deepseek-ai/dsh-api-gateway/client'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(import.meta.url)
let gateway: typeof Gateway
runInNewContext(
  readFileSync(
    process.env.DSH_GATEWAY_BUNDLE ?? require.resolve('@deepseek-ai/dsh-api-gateway/client'),
    'utf8',
  ),
  {
    window: {
      __ModuleLoader__: {
        load: ({ factory }: { factory: (require: NodeJS.Require) => typeof Gateway }) => {
          gateway = factory(require)
        },
      },
    },
    console,
    crypto: globalThis.crypto,
    AbortController,
    AbortSignal,
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
  },
)
import sessionRemote from '@deepseek-ai/dsh-api-session-controller/remote'
import { expect, it, vi } from 'vitest'
import { installOpenAdapter } from '../src/client/adapter.js'

it('intercepts a real generated Cordis Remote method and restores it across remounts', async () => {
  const ctx = new Context()
  await ctx.plugin(TypertRegistry)
  const call = vi.fn(async () => ({ ok: true, value: { opened: true } }))
  ctx.provide('connection', {
    rpc: { call, open: async function* () {} },
    registerGenerationSource: () => () => {},
    start: () => ({ stop() {} }),
  })
  const client = ctx.plugin(gateway!)
  await client
  let unmount = await ctx.remote.$mount(sessionRemote)
  const opened: string[] = []
  for (let index = 0; index < 2; index++) {
    const ns = ctx.remote.session
    const original = Object.getOwnPropertyDescriptor(ns, 'openWorkspacePath')
    const adapter = installOpenAdapter(ns, (request) => {
      opened.push(request.path)
      return true
    })
    expect(await ctx.remote.session.openWorkspacePath({ path: '/test/a.md' })).toEqual({
      ok: true,
      value: { opened: true },
    })
    expect(call).not.toHaveBeenCalled()
    await adapter.native({ path: '/test/b.md' })
    expect(call).toHaveBeenCalledTimes(1)
    adapter.dispose()
    expect(Object.getOwnPropertyDescriptor(ns, 'openWorkspacePath')).toEqual(original)
    await ns.openWorkspacePath({ path: '/test/c.md' })
    expect(call).toHaveBeenCalledTimes(2)
    call.mockClear()
    await unmount()
    unmount = await ctx.remote.$mount(sessionRemote)
  }
  expect(opened).toEqual(['/test/a.md', '/test/a.md'])
  await unmount()
  await client.dispose()
})
it('preserves later adapters and refuses non-configurable methods', () => {
  const ns = { openWorkspacePath: vi.fn() }
  const first = installOpenAdapter(ns, () => true)
  const second = installOpenAdapter(ns, () => true)
  const descriptor = Object.getOwnPropertyDescriptor(ns, 'openWorkspacePath')
  first.dispose()
  expect(Object.getOwnPropertyDescriptor(ns, 'openWorkspacePath')).toEqual(descriptor)
  expect(() => installOpenAdapter(Object.freeze({ openWorkspacePath() {} }), () => true)).toThrow(
    'incompatible',
  )
})
it('an unloaded inner adapter stays inactive when a later adapter restores it', async () => {
  const original = vi.fn(async () => ({ ok: true as const, value: { opened: true } }))
  const ns = { openWorkspacePath: original }
  const intercept = vi.fn(() => true)
  const first = installOpenAdapter(ns, intercept)
  const second = installOpenAdapter(ns, () => true)
  first.dispose()
  second.dispose()
  await ns.openWorkspacePath()
  expect(intercept).not.toHaveBeenCalled()
  expect(original).toHaveBeenCalledTimes(1)
})
