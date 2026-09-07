// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { Controller } from '../src/client/controller.js'
it('pins sessions, ignores stale reads and aborts on close', async () => {
  const pending: Array<{ url: URL; init: RequestInit; resolve: (r: Response) => void }> = []
  const controller = new Controller(
    (url, init) => new Promise((resolve) => pending.push({ url, init, resolve })),
  )
  controller.open('first')
  const first = pending[0]!
  controller.open('second')
  expect(first.init.signal?.aborted).toBe(true)
  first.resolve(Response.json({ roots: [{ path: '/old', name: 'old' }] }))
  pending[1]!.resolve(Response.json({ roots: [] }))
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(controller.store.getSnapshot()).toMatchObject({
    sessionId: 'second',
    roots: [],
    busy: false,
  })
  const a = controller.select('/a'),
    b = controller.select('/b')
  pending[3]!.resolve(Response.json({ kind: 'text', path: '/b', name: 'b', size: 1, content: 'b' }))
  await b
  pending[2]!.resolve(Response.json({ kind: 'text', path: '/a', name: 'a', size: 1, content: 'a' }))
  await a
  expect(controller.store.getSnapshot().file?.path).toBe('/b')
  expect(pending[3]!.url.searchParams.get('sessionId')).toBe('second')
  controller.close()
  expect(pending[3]!.init.signal?.aborted).toBe(true)
  expect(controller.store.getSnapshot().opened).toBe(false)
})
