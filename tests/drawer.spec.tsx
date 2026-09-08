// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Drawer } from '../src/client/Drawer.js'
import { Controller } from '../src/client/controller.js'
import { en } from '../src/client/locales.js'
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Button: ({ variant: _variant, size: _size, ...props }: Record<string, unknown>) =>
    createElement('button', props),
}))
afterEach(cleanup)
it('shows source without executing HTML and restores focus after closing', async () => {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const controller = new Controller(async (url) =>
    Response.json(
      url.searchParams.get('op') === 'roots'
        ? { roots: [{ path: '/demo', name: 'demo' }] }
        : url.searchParams.get('op') === 'list'
          ? { entries: [], truncated: false }
          : {
              kind: 'text',
              path: '/demo/a.html',
              name: 'a.html',
              size: 30,
              content: '<script>window.executed=true</script>',
            },
    ),
  )
  const view = render(<Drawer controller={controller} t={(key) => en[key]} />)
  controller.open('test', '/demo/a.html')
  await waitFor(() => expect(view.getByRole('dialog')).toBeTruthy())
  await waitFor(() => expect(view.container.textContent).toContain('window.executed'))
  expect(view.container.querySelector('script')).toBeNull()
  expect(view.container.querySelector('.dfe-drawer')?.contains(document.activeElement)).toBe(true)
  fireEvent.keyDown(document, { key: 'Escape' })
  await waitFor(() => expect(view.queryByRole('dialog')).toBeNull())
  await waitFor(() => expect(document.activeElement).toBe(trigger))
  expect(view.container.querySelector('.dfe-backdrop')).toBeNull()
  trigger.remove()
})
it('renders Markdown without loading remote images or raw HTML', async () => {
  const controller = new Controller(async (url) =>
    Response.json(
      url.searchParams.get('op') === 'roots'
        ? { roots: [] }
        : {
            kind: 'markdown',
            path: '/a.md',
            name: 'a.md',
            size: 40,
            content: '# Heading\n![image](https://example.com/image.png)\n<script>bad()</script>',
          },
    ),
  )
  const view = render(<Drawer controller={controller} t={(key) => en[key]} />)
  controller.open('test', '/a.md')
  await waitFor(() => expect(view.getByRole('heading', { name: 'Heading' })).toBeTruthy())
  expect(view.container.querySelector('img')).toBeNull()
  expect(view.container.querySelector('script')).toBeNull()
  controller.close()
})

it('explains empty filters, clears them, and switches narrow screens to the selected file', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const controller = new Controller(async (url) =>
    Response.json(
      url.searchParams.get('op') === 'roots'
        ? { roots: [{ path: '/demo', name: 'demo' }] }
        : url.searchParams.get('op') === 'list'
          ? {
              entries: [{ path: '/demo/a.txt', name: 'a.txt', directory: false }],
              truncated: false,
            }
          : { kind: 'text', path: '/demo/a.txt', name: 'a.txt', size: 5, content: 'hello' },
    ),
  )
  try {
    const view = render(<Drawer controller={controller} t={(key) => en[key]} />)
    controller.open('test')
    await waitFor(() => expect(view.getByRole('button', { name: 'a.txt' })).toBeTruthy())
    fireEvent.change(view.getByRole('textbox', { name: en.filter }), {
      target: { value: 'missing' },
    })
    expect(view.getByText(en.noMatches)).toBeTruthy()
    expect(view.queryByRole('button', { name: 'a.txt' })).toBeNull()
    fireEvent.click(view.getByRole('button', { name: en.clearFilter }))
    expect(view.queryByText(en.noMatches)).toBeNull()
    fireEvent.click(view.getByRole('button', { name: 'a.txt' }))
    await waitFor(() => expect(view.container.textContent).toContain('hello'))
    expect(view.queryByRole('navigation', { name: en.tree })).toBeNull()
    expect(view.getByRole('button', { name: en.tree }).getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement?.className).toBe('dfe-main')
    fireEvent.click(view.getByRole('button', { name: en.tree }))
    expect(view.getByRole('navigation', { name: en.tree })).toBeTruthy()
    controller.close()
  } finally {
    vi.unstubAllGlobals()
  }
})
