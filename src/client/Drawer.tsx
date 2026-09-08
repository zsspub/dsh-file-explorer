/** Overlay drawer with keyboard focus containment and a pointer-blocking backdrop. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CodeXml,
  Copy,
  ExternalLink,
  Eye,
  File,
  Folder,
  FolderOpen,
  PanelLeft,
  RefreshCw,
  X,
} from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js/lib/common'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Controller, State } from './controller.js'
import type { Translate } from './locales.js'
const css = `
.dfe-backdrop{position:fixed;inset:0;background:#0005;pointer-events:auto;display:flex;justify-content:flex-end;z-index:1000}
.dfe-drawer{width:min(70vw,1120px);height:100%;background:var(--dsw-alias-bg-layer-1,#18191c);color:var(--dsw-alias-label-primary,#eee);box-shadow:-8px 0 30px #0003;display:flex;flex-direction:column;font:14px/1.5 system-ui}
.dfe-drawer *{box-sizing:border-box}.dfe-head{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-default,#ffffff20)}.dfe-head strong{flex:1;font-size:16px}.dfe-body{display:flex;flex:1;min-height:0}.dfe-tree{width:230px;flex-shrink:0;border-right:1px solid var(--dsw-alias-border-default,#ffffff20);overflow:auto;padding:12px}.dfe-tree input,.dfe-tree select{width:100%;margin-bottom:10px;padding:7px;background:var(--dsw-alias-bg-layer-2,#28292d);color:inherit;border:1px solid var(--dsw-alias-border-default,#8885);border-radius:6px}.dfe-tree ul{list-style:none;margin:0;padding-left:12px}.dfe-tree>ul{padding-left:0}.dfe-item{display:flex;align-items:center;gap:6px;border:0;background:none;color:inherit;text-align:left;width:100%;padding:5px 3px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dfe-item svg{flex-shrink:0}.dfe-item-name{overflow:hidden;text-overflow:ellipsis}.dfe-head button,.dfe-toolbar button{display:inline-flex;align-items:center;gap:6px}.dfe-item:hover,.dfe-item[aria-current=true]{background:var(--dsw-alias-bg-layer-2,#ffffff12);border-radius:4px}.dfe-main{flex:1;min-width:0;display:flex;flex-direction:column}.dfe-path{padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-default,#ffffff20);overflow-wrap:anywhere;font-size:12px;opacity:.8}.dfe-crumb{background:none;border:0;color:inherit;padding:0;cursor:pointer;text-decoration:underline}.dfe-content{overflow:auto;padding:18px;flex:1}.dfe-content pre{font:13px/1.7 ui-monospace,monospace;tab-size:2;margin:0}.dfe-line{display:block;min-height:1.7em;white-space:pre}.dfe-line:before{content:attr(data-line);display:inline-block;width:42px;text-align:right;margin-right:18px;opacity:.35;user-select:none}.dfe-content img{max-width:100%;height:auto}.dfe-content table{border-collapse:collapse}.dfe-content td,.dfe-content th{border:1px solid #8885;padding:6px}.dfe-status{padding:18px;opacity:.75}.dfe-error{padding:12px;color:var(--text-danger,#ff8e8e);overflow-wrap:anywhere}.dfe-toolbar{display:flex;gap:8px;padding:8px 16px;align-items:center}.dfe-drawer :focus-visible{outline:2px solid var(--accent,#7eaaff);outline-offset:2px}.hljs-keyword,.hljs-selector-tag{color:#bf94e4}.hljs-string,.hljs-attr{color:#91bf8e}.hljs-number,.hljs-literal{color:#dfad79}.hljs-comment{color:#8c939f}.hljs-title,.hljs-built_in{color:#80b9dc}@media(max-width:760px){.dfe-drawer{width:100vw}.dfe-tree{width:190px}}`
function Tree({
  path,
  state,
  controller,
  filter,
  t,
}: {
  path: string
  state: State
  controller: Controller
  filter: string
  t: Translate
}) {
  const entries = state.directories[path]
  if (!entries) return null
  return (
    <ul>
      {entries.length === 0 && <li>{t('empty')}</li>}
      {entries
        .filter((e) => e.directory || e.name.toLowerCase().includes(filter.toLowerCase()))
        .map((e) => (
          <li key={e.path}>
            <button
              className="dfe-item"
              title={e.path}
              aria-current={state.selected === e.path}
              aria-expanded={e.directory ? state.expanded.includes(e.path) : undefined}
              onClick={() => {
                void (e.directory ? controller.expand(e.path) : controller.select(e.path))
              }}
            >
              {e.directory ? (
                <>
                  {state.expanded.includes(e.path) ? (
                    <ChevronDown size={14} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={14} aria-hidden="true" />
                  )}
                  {state.expanded.includes(e.path) ? (
                    <FolderOpen size={16} aria-hidden="true" />
                  ) : (
                    <Folder size={16} aria-hidden="true" />
                  )}
                </>
              ) : (
                <File size={16} aria-hidden="true" style={{ marginLeft: 20 }} />
              )}
              <span className="dfe-item-name">{e.name}</span>
            </button>
            {e.directory && state.expanded.includes(e.path) && (
              <Tree {...{ state, controller, filter, t }} path={e.path} />
            )}
          </li>
        ))}
    </ul>
  )
}
function Source({ content, name }: { content: string; name: string }) {
  const ext = name.split('.').pop() ?? ''
  const language =
    (
      {
        tsx: 'typescript',
        ts: 'typescript',
        jsx: 'javascript',
        js: 'javascript',
        md: 'markdown',
        svg: 'xml',
        html: 'xml',
        htm: 'xml',
        yml: 'yaml',
        py: 'python',
        sh: 'bash',
      } as Record<string, string>
    )[ext] ?? ext
  return (
    <pre>
      {content.split('\n').map((line, i) => (
        <span className="dfe-line" data-line={i + 1} key={i}>
          {hljs.getLanguage(language) && content.length < 200000 ? (
            <span
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(line, { language, ignoreIllegals: true }).value,
              }}
            />
          ) : (
            line
          )}
        </span>
      ))}
    </pre>
  )
}
export function Drawer({ controller, t }: { controller: Controller; t: Translate }) {
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot)
  const ref = useRef<HTMLElement>(null)
  const [tree, setTree] = useState(true),
    [filter, setFilter] = useState(''),
    [source, setSource] = useState(false),
    [zoom, setZoom] = useState(100),
    [copied, setCopied] = useState(false),
    [localError, setLocalError] = useState<string>()
  useEffect(() => {
    setSource(false)
    setZoom(100)
    setCopied(false)
    setLocalError(undefined)
  }, [state.selected])
  useEffect(() => {
    if (!state.opened) return
    ref.current?.focus()
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        controller.close()
      }
      if (event.key === 'Tab') {
        const items = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input,select,a[href],[tabindex="0"]',
          ) ?? []),
        ].filter((el) => el.getClientRects().length)
        const first = items[0],
          last = items.at(-1)
        if (!first) {
          event.preventDefault()
          return
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          event.preventDefault()
          last?.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === ref.current)
        ) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) ref.current?.focus()
    }
    document.addEventListener('keydown', listener, true)
    document.addEventListener('focusin', focus)
    return () => {
      document.removeEventListener('keydown', listener, true)
      document.removeEventListener('focusin', focus)
    }
  }, [state.opened, controller])
  if (!state.opened) return null
  const file = state.file
  return (
    <div
      className="dfe-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) controller.close()
      }}
    >
      <style>{css}</style>
      <section
        className="dfe-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        ref={ref}
        tabIndex={-1}
      >
        <header className="dfe-head">
          <strong>{t('title')}</strong>
          <Button variant="ghost" onClick={() => setTree(!tree)}>
            <PanelLeft size={16} aria-hidden="true" />
            {t('tree')}
          </Button>
          <Button variant="ghost" onClick={() => controller.refresh()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t('refresh')}
          </Button>
          <Button variant="ghost" aria-label={t('close')} onClick={() => controller.close()}>
            <X size={18} aria-hidden="true" />
          </Button>
        </header>
        {controller.compatibilityError && (
          <div className="dfe-error">
            {t('compatibility')}: {controller.compatibilityError}
          </div>
        )}
        <div className="dfe-body">
          {tree && (
            <nav className="dfe-tree" aria-label={t('tree')}>
              <select
                aria-label={t('roots')}
                value={state.root ?? ''}
                onChange={(e) => controller.chooseRoot(e.target.value)}
              >
                {state.roots.map((r) => (
                  <option key={r.path} value={r.path}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                placeholder={t('filter')}
                aria-label={t('filter')}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {state.root && <Tree path={state.root} {...{ state, controller, filter, t }} />}
              {state.truncated && <p>{t('truncated')}</p>}
            </nav>
          )}
          <main className="dfe-main">
            <nav className="dfe-path" aria-label={t('path')}>
              <button
                className="dfe-crumb"
                onClick={() => {
                  if (state.root) void controller.select(state.root)
                }}
              >
                {state.root ?? ''}
              </button>
              {state.selected &&
                state.root &&
                state.selected.startsWith(state.root + '/') &&
                state.selected
                  .slice(state.root.length + 1)
                  .split('/')
                  .map((part, index, parts) => (
                    <span key={index}>
                      {' '}
                      /{' '}
                      {index === parts.length - 1 ? (
                        part
                      ) : (
                        <button
                          className="dfe-crumb"
                          onClick={() => {
                            void controller.select(
                              state.root + '/' + parts.slice(0, index + 1).join('/'),
                            )
                          }}
                        >
                          {part}
                        </button>
                      )}
                    </span>
                  ))}
            </nav>
            {(state.error || localError) && (
              <div role="alert" className="dfe-error">
                {t('failure')}: {state.error ?? localError}
              </div>
            )}
            {state.busy ? (
              <div className="dfe-status" role="status">
                {t('loading')}
              </div>
            ) : file ? (
              <>
                <div className="dfe-toolbar">
                  {file.kind === 'markdown' && (
                    <Button variant="ghost" onClick={() => setSource(!source)}>
                      {source ? (
                        <Eye size={16} aria-hidden="true" />
                      ) : (
                        <CodeXml size={16} aria-hidden="true" />
                      )}
                      {source ? t('preview') : t('source')}
                    </Button>
                  )}
                  {(file.kind === 'text' || file.kind === 'markdown') && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard.writeText(file.content ?? '').then(
                          () => setCopied(true),
                          () => setLocalError(t('copyFailed')),
                        )
                      }}
                    >
                      {copied ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <Copy size={16} aria-hidden="true" />
                      )}
                      {copied ? t('copied') : t('copy')}
                    </Button>
                  )}
                  {file.kind === 'image' && (
                    <input
                      aria-label={t('zoom')}
                      type="range"
                      min="25"
                      max="200"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  )}
                  {controller.native && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void controller.openNative()
                      }}
                    >
                      <ExternalLink size={16} aria-hidden="true" />
                      {t('native')}
                    </Button>
                  )}
                </div>
                <div className="dfe-content">
                  {file.kind === 'image' ? (
                    <img
                      src={`data:${file.mime};base64,${file.content}`}
                      alt={file.name}
                      onError={() => setLocalError(t('imageFailed'))}
                      style={{ zoom: `${zoom}%` }}
                    />
                  ) : file.kind === 'binary' || file.kind === 'large' ? (
                    <p>
                      {t(file.kind)} · {file.size} B
                    </p>
                  ) : file.kind === 'markdown' && !source ? (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      skipHtml
                      components={{ img: () => null, a: ({ children }) => <span>{children}</span> }}
                    >
                      {file.content ?? ''}
                    </Markdown>
                  ) : (
                    <Source content={file.content ?? ''} name={file.name} />
                  )}
                </div>
              </>
            ) : (
              <div className="dfe-status">{state.roots.length ? t('select') : t('noRoots')}</div>
            )}
          </main>
        </div>
      </section>
    </div>
  )
}
