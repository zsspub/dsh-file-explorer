/** Host plugin exposing authenticated, read-only file browsing routes. */
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type { ConnectionFetchRoute } from '@deepseek-ai/dsh-client-connection'
import type { SessionHeader } from '@deepseek-ai/dsh-session'
import { SessionId } from '@deepseek-ai/dsh-session'
import {
  FileError,
  defaults,
  rootsFor,
  allowedPath,
  listDirectory,
  readFileView,
  type Config as FileConfig,
} from './files.js'
import { stat } from 'node:fs/promises'

export type Config = FileConfig
export const Config = Schema.object({
  extraRoots: Schema.array(Schema.string()).default([]),
  maxTextBytes: Schema.number().min(1).step(1).default(defaults.maxTextBytes),
  maxImageBytes: Schema.number().min(1).step(1).default(defaults.maxImageBytes),
  maxDirectoryEntries: Schema.number().min(1).step(1).default(defaults.maxDirectoryEntries),
})
export const inject = ['connection', 'sessions', 'sessionPersistence']

/** Install routes after Host authentication; roots are derived from stored sessions. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  // npm rc.1 types predate master d347e70's header-only stat API.
  const persistence = ctx.sessionPersistence as unknown as {
    stat(id: SessionId): Promise<{ header: SessionHeader } | undefined>
  }
  if (typeof persistence.stat !== 'function')
    throw new Error(
      'file-explorer requires DSH sessionPersistence.stat (master d347e70 or compatible)',
    )
  await rootsFor(undefined, config)
  const route: ConnectionFetchRoute & { requestBody: 'buffered' } = {
    path: '/api/file-explorer',
    methods: ['GET'],
    requestBody: 'buffered',
    async fetch(request) {
      try {
        const url = new URL(request.url)
        const id = url.searchParams.get('sessionId')
        if (!id) throw new FileError(400, 'Session required')
        const sessionId = SessionId(id)
        const live = ctx.sessions.get(sessionId)
        const header = live?.header ?? (await persistence.stat(sessionId))?.header
        if (!header) throw new FileError(404, 'Session not found')
        const roots = await rootsFor(header.cwd, config)
        const op = url.searchParams.get('op')
        let value: unknown
        if (op === 'roots') value = { roots }
        else {
          const path = url.searchParams.get('path')
          if (!path) throw new FileError(400, 'Path required')
          if (op === 'list') value = await listDirectory(path, roots, config)
          else if (op === 'read') {
            const canonical = await allowedPath(path, roots)
            value = (await stat(canonical)).isDirectory()
              ? { kind: 'directory', path: canonical }
              : await readFileView(path, roots, config)
          } else throw new FileError(400, 'Unknown operation')
        }
        return Response.json(value, { headers: { 'Cache-Control': 'no-store' } })
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        const status =
          error instanceof FileError
            ? error.status
            : code === 'ENOENT'
              ? 404
              : code === 'EACCES' || code === 'EPERM'
                ? 403
                : 500
        return Response.json(
          {
            error:
              error instanceof FileError
                ? error.message
                : status === 404
                  ? 'File not found'
                  : status === 403
                    ? 'Permission denied'
                    : 'File operation failed',
          },
          { status, headers: { 'Cache-Control': 'no-store' } },
        )
      }
    },
  }
  ctx.effect(() => ctx.connection.fetch.register(route), 'file-explorer: read route')
}
