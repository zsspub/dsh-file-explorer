/** Read-only Host filesystem operations, constrained to server-owned roots. */
import { constants } from 'node:fs'
import { open, opendir, realpath, stat } from 'node:fs/promises'
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path'

export interface Config {
  extraRoots: string[]
  maxTextBytes: number
  maxImageBytes: number
  maxDirectoryEntries: number
}
export const defaults: Config = {
  extraRoots: [],
  maxTextBytes: 2 * 1024 ** 2,
  maxImageBytes: 20 * 1024 ** 2,
  maxDirectoryEntries: 2000,
}
export interface Root {
  path: string
  name: string
  authoredPath?: string
}
export interface Entry {
  path: string
  name: string
  directory: boolean
}
export type FileView = {
  path: string
  name: string
  size: number
  kind: 'text' | 'markdown' | 'image' | 'binary' | 'large'
  content?: string
  mime?: string
}
const images: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
}

/** A request failure with a non-sensitive HTTP status. */
export class FileError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function within(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

/**
 * Resolve roots from a trusted session cwd and configured Host directories.
 * @param cwd - Host-observed session cwd, never supplied by the browser.
 * @param config - Validated deployment settings.
 * @returns Canonical roots; missing configured roots fail explicitly.
 */
export async function rootsFor(cwd: string | undefined, config: Config): Promise<Root[]> {
  const paths = [...new Set([...(cwd ? [cwd] : []), ...config.extraRoots])]
  const roots: Root[] = []
  for (const path of paths) {
    if (!isAbsolute(path)) throw new FileError(400, 'Root must be absolute')
    const canonical = await realpath(path)
    if (!(await stat(canonical)).isDirectory()) throw new FileError(400, 'Root is not a directory')
    if (!roots.some((root) => root.path === canonical))
      roots.push({ path: canonical, authoredPath: resolve(path), name: basename(path) || path })
  }
  return roots
}

/** Resolve both authored and canonical paths inside the allowed root set. */
export async function allowedPath(path: string, roots: Root[]): Promise<string> {
  if (
    !isAbsolute(path) ||
    !roots.some(
      (root) =>
        within(root.path, resolve(path)) ||
        (root.authoredPath !== undefined && within(root.authoredPath, resolve(path))),
    )
  )
    throw new FileError(403, 'Path outside allowed roots')
  const canonical = await realpath(path)
  if (!roots.some((root) => within(root.path, canonical)))
    throw new FileError(403, 'Symlink outside allowed roots')
  return canonical
}

/** Read at most the configured directory limit without traversing children. */
export async function listDirectory(
  path: string,
  roots: Root[],
  config: Config,
): Promise<{ path: string; entries: Entry[]; truncated: boolean }> {
  const canonical = await allowedPath(path, roots)
  const entries: Entry[] = []
  let truncated = false
  const directory = await opendir(canonical)
  for await (const entry of directory) {
    if (entries.length >= config.maxDirectoryEntries) {
      truncated = true
      break
    }
    const child = resolve(canonical, entry.name)
    let directory = entry.isDirectory()
    if (entry.isSymbolicLink()) {
      try {
        directory = (await stat(await allowedPath(child, roots))).isDirectory()
      } catch (error) {
        if (error instanceof FileError && error.status === 403) continue
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
        throw error
      }
    }
    entries.push({ path: child, name: entry.name, directory })
  }
  entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name))
  return { path: canonical, entries, truncated }
}

/** Read a bounded regular file; HTML and SVG are always plain source text. */
export async function readFileView(path: string, roots: Root[], config: Config): Promise<FileView> {
  const canonical = await allowedPath(path, roots)
  if (!(await stat(canonical)).isFile()) throw new FileError(400, 'Not a regular file')
  const handle = await open(
    canonical,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  )
  try {
    const info = await handle.stat()
    if (!info.isFile()) throw new FileError(400, 'Not a regular file')
    // Recheck after opening to detect a root/path replacement before serving bytes.
    const current = await allowedPath(path, roots)
    const after = await stat(current)
    if (current !== canonical || after.dev !== info.dev || after.ino !== info.ino)
      throw new FileError(409, 'File changed; retry')
    const ext = extname(canonical).toLowerCase()
    const mime = images[ext]
    const limit = mime ? config.maxImageBytes : config.maxTextBytes
    const base = { path: canonical, name: basename(canonical), size: info.size }
    if (info.size > limit) return { ...base, kind: 'large' }
    const buffer = Buffer.alloc(Math.min(info.size + 1, limit + 1))
    let bytesRead = 0
    while (bytesRead < buffer.length) {
      const part = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead)
      if (!part.bytesRead) break
      bytesRead += part.bytesRead
    }
    if (bytesRead > info.size) throw new FileError(409, 'File changed; retry')
    const data = buffer.subarray(0, bytesRead)
    if (mime) return { ...base, kind: 'image', mime, content: data.toString('base64') }
    if (data.includes(0)) return { ...base, kind: 'binary' }
    let content: string
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(data)
    } catch {
      return { ...base, kind: 'binary' }
    }
    return { ...base, kind: ['.md', '.markdown'].includes(ext) ? 'markdown' : 'text', content }
  } finally {
    await handle.close()
  }
}
