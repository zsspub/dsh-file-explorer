/** Reversible compatibility adapter for DSH's generated Remote namespace. */
export type OpenRequest = { path: string }
export type OpenResult =
  | { ok: true; value: { opened: boolean } }
  | { ok: false; error: { code: string; message: string; details: object } }
export type NativeOpen = (request: OpenRequest, signal?: AbortSignal) => Promise<OpenResult>

/**
 * Replace only the configurable generated method; retain its getter receiver.
 * @param namespace - Actual Remote session service, including Cordis tracing.
 * @param open - Viewer callback; false delegates to the original method.
 * @returns Original caller and conditional restoration disposer.
 */
export function installOpenAdapter(namespace: object, open: (request: OpenRequest) => boolean) {
  const original = Object.getOwnPropertyDescriptor(namespace, 'openWorkspacePath')
  if (!original?.configurable || (!original.get && typeof original.value !== 'function')) {
    throw new Error('DSH file opener is incompatible: expected a configurable generated method')
  }
  let active = true
  const resolve = (receiver: object): NativeOpen =>
    original.get ? (original.get.call(receiver) as NativeOpen) : (original.value as NativeOpen)
  const native: NativeOpen = (request, signal) =>
    resolve(namespace).call(namespace, request, signal)
  const getter = function (this: object): NativeOpen {
    const receiver = this
    return async (request, signal) => {
      signal?.throwIfAborted()
      if (active && open(request)) return { ok: true, value: { opened: true } }
      return resolve(receiver).call(receiver, request, signal)
    }
  }
  Object.defineProperty(namespace, 'openWorkspacePath', {
    configurable: true,
    enumerable: original.enumerable,
    get: getter,
  })
  return {
    native,
    dispose() {
      active = false
      if (Object.getOwnPropertyDescriptor(namespace, 'openWorkspacePath')?.get === getter) {
        Object.defineProperty(namespace, 'openWorkspacePath', original)
      }
    },
  }
}
