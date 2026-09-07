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
it('selects the canonical extra root when the opener passes a path alias', async () => {
  const controller = new Controller(async (url) =>
    Response.json(
      url.searchParams.get('op') === 'roots'
        ? {
            roots: [
              { path: '/work', name: 'work' },
              { path: '/private/tmp/extra', name: 'extra' },
            ],
          }
        : url.searchParams.get('op') === 'list'
          ? { entries: [], truncated: false }
          : {
              kind: 'text',
              path: '/private/tmp/extra/a.txt',
              name: 'a.txt',
              size: 1,
              content: 'a',
            },
    ),
  )
  controller.open('test', '/tmp/extra/a.txt')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(controller.store.getSnapshot()).toMatchObject({
    root: '/private/tmp/extra',
    selected: '/private/tmp/extra/a.txt',
    busy: false,
  })
  controller.close()
})
