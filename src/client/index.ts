/** Browser entry: session utility, overlay drawer and reversible file-open adapter. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { createElement } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { Controller } from './controller.js'
import { installOpenAdapter } from './adapter.js'
import { Drawer } from './Drawer.js'
import { NS, zh, en, type Translate } from './locales.js'
export const inject = ['slots', 'locale', 'sessions', 'connection', 'remote']
function Entry({ open, t }: { open: () => void; t: Translate }) {
  return createElement(
    Button,
    { size: 'sm', variant: 'ghost', onClick: open, 'aria-haspopup': 'dialog' },
    t('title'),
  )
}
/** Install the viewer without replacing DSH UI components or Host methods. */
export function apply(ctx: Context): void {
  const controller = new Controller((url, init) =>
    fetch(url, { ...init, credentials: 'same-origin' }),
  )
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'file-explorer: dictionaries')
  ctx.effect(() => () => controller.close(), 'file-explorer: cancel reads')
  ctx.inject(['remote.session'], (scope) => {
    try {
      const adapter = installOpenAdapter(scope.remote.session, (request) => {
        const id = scope.sessions.list.getSnapshot().current
        if (!id) return false
        controller.open(id, request.path)
        return true
      })
      controller.native = adapter.native
      controller.compatibilityError = undefined
      scope.effect(
        () => () => {
          adapter.dispose()
          controller.native = undefined
          controller.close()
        },
        'file-explorer: restore opener',
      )
    } catch (error) {
      controller.compatibilityError = String(error)
      console.error('[file-explorer]', error)
    }
  })
  let current = ctx.sessions.list.getSnapshot().current
  ctx.effect(
    () =>
      ctx.sessions.list.subscribe(() => {
        const next = ctx.sessions.list.getSnapshot().current
        if (next !== current) {
          current = next
          controller.close()
        }
      }),
    'file-explorer: session changes',
  )
  ctx.slots.inject('conversation.session.header.utilities', () =>
    ctx.slots.register(
      {
        name: 'conversation.session.header.utilities',
        id: 'file-explorer',
        order: 110,
        locale: NS,
        inject: (sessionId) => ({ open: () => controller.open(sessionId) }),
      },
      Entry,
    ),
  )
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'file-explorer',
        order: 110,
        locale: NS,
        inject: () => ({ controller }),
      },
      Drawer,
    ),
  )
}
