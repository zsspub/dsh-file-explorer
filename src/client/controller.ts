/** Transient drawer state and cancellable, session-pinned reads. */
import type { Root, Entry, FileView } from '../files.js'
import type { NativeOpen } from './adapter.js'
export interface State {
  opened: boolean
  sessionId?: string
  roots: Root[]
  root?: string
  selected?: string
  directories: Record<string, Entry[]>
  expanded: string[]
  file?: FileView
  busy: boolean
  error?: string
  truncated: boolean
}
export class Controller {
  private value: State = {
    opened: false,
    roots: [],
    directories: {},
    expanded: [],
    busy: false,
    truncated: false,
  }
  private listeners = new Set<() => void>()
  private lifetime = new AbortController()
  private revision = 0
  private focus?: HTMLElement
  native?: NativeOpen
  compatibilityError?: string
  readonly store = {
    getSnapshot: () => this.value,
    subscribe: (fn: () => void) => {
      this.listeners.add(fn)
      return () => {
        this.listeners.delete(fn)
      }
    },
  }
  constructor(private readonly fetcher: (url: URL, init: RequestInit) => Promise<Response>) {}
  private set(change: Partial<State>) {
    this.value = { ...this.value, ...change }
    for (const fn of this.listeners) fn()
  }
  private async request<T>(op: string, path?: string): Promise<T> {
    const sessionId = this.value.sessionId
    if (!sessionId) throw new Error('Session required')
    const url = new URL('/api/file-explorer', location.origin)
    url.searchParams.set('sessionId', sessionId)
    url.searchParams.set('op', op)
    if (path) url.searchParams.set('path', path)
    const result = await this.fetcher(url, { method: 'GET', signal: this.lifetime.signal })
    if (!result.ok) {
      const body = (await result.json()) as { error?: string }
      throw new Error(body.error || `HTTP ${result.status}`)
    }
    return (await result.json()) as T
  }
  open(sessionId: string, path?: string) {
    if (!this.value.opened)
      this.focus =
        document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    this.lifetime.abort()
    this.lifetime = new AbortController()
    ++this.revision
    this.set({
      opened: true,
      sessionId,
      roots: [],
      directories: {},
      expanded: [],
      file: undefined,
      selected: undefined,
      root: undefined,
      busy: true,
      error: undefined,
      truncated: false,
    })
    void this.initialize(path)
  }
  private async initialize(path?: string) {
    const revision = this.revision
    try {
      const { roots } = await this.request<{ roots: Root[] }>('roots')
      if (revision !== this.revision) return
      const root =
        (path ? roots.find((r) => path === r.path || path.startsWith(r.path + '/')) : undefined)
          ?.path ?? roots[0]?.path
      this.set({ roots, root, busy: false })
      if (root) await this.expand(root)
      if (revision === this.revision && path) await this.select(path)
    } catch (error) {
      if (revision === this.revision) this.set({ busy: false, error: String(error) })
    }
  }
  close() {
    this.lifetime.abort()
    ++this.revision
    this.set({ opened: false, busy: false })
    const target = this.focus
    setTimeout(() => {
      if (!this.value.opened && target?.isConnected) target.focus()
    }, 0)
  }
  async expand(path: string, force = false) {
    const revision = this.revision
    if (!force && this.value.expanded.includes(path)) {
      this.set({ expanded: this.value.expanded.filter((p) => p !== path) })
      return
    }
    try {
      const result = await this.request<{ entries: Entry[]; truncated: boolean }>('list', path)
      if (revision !== this.revision) return
      this.set({
        directories: { ...this.value.directories, [path]: result.entries },
        expanded: [...new Set([...this.value.expanded, path])],
        truncated: this.value.truncated || result.truncated,
      })
    } catch (error) {
      if (revision === this.revision) this.set({ error: String(error) })
    }
  }
  async select(path: string) {
    const revision = ++this.revision
    this.set({ selected: path, busy: true, file: undefined, error: undefined })
    try {
      const result = await this.request<FileView | { kind: 'directory'; path: string }>(
        'read',
        path,
      )
      if (revision !== this.revision) return
      const root =
        this.value.roots.find(
          (entry) => result.path === entry.path || result.path.startsWith(entry.path + '/'),
        )?.path ?? this.value.root
      const changedRoot = root !== this.value.root
      this.set({ selected: result.path, root })
      if (changedRoot && root) await this.expand(root, true)
      if (revision !== this.revision) return
      if (result.kind === 'directory') {
        this.set({ busy: false })
        await this.expand(result.path, true)
      } else this.set({ busy: false, file: result })
    } catch (error) {
      if (revision === this.revision) this.set({ busy: false, error: String(error) })
    }
  }
  chooseRoot(path: string) {
    ++this.revision
    this.set({
      root: path,
      selected: undefined,
      file: undefined,
      error: undefined,
      truncated: false,
    })
    void this.expand(path, true)
  }
  refresh() {
    const { sessionId, selected } = this.value
    if (sessionId) this.open(sessionId, selected)
  }
  async openNative() {
    const revision = this.revision
    const path = this.value.selected
    if (!path || !this.native) return
    try {
      const result = await this.native({ path })
      if (!result.ok) throw new Error(result.error.message)
    } catch (error) {
      if (revision === this.revision) this.set({ error: String(error) })
    }
  }
}
