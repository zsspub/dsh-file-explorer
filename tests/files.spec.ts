import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { defaults, rootsFor, allowedPath, listDirectory, readFileView } from '../src/files.js'
const cleanup: string[] = []
afterEach(async () => {
  for (const path of cleanup.splice(0)) await rm(path, { recursive: true, force: true })
})
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'dfe-'))
  cleanup.push(root)
  return { root, roots: await rootsFor(root, defaults) }
}
it('reads Unicode text, Markdown, HTML and SVG as safe source', async () => {
  const { root, roots } = await fixture()
  for (const [name, kind] of [
    ['你好.md', 'markdown'],
    ['a.ts', 'text'],
    ['a.html', 'text'],
    ['a.svg', 'text'],
  ]) {
    const path = join(root, name)
    await writeFile(path, '<script>alert(1)</script>你好')
    expect(await readFileView(path, roots, defaults)).toMatchObject({
      kind,
      content: '<script>alert(1)</script>你好',
    })
  }
})
it('rejects escape paths and symlinks; permits explicitly configured extra roots', async () => {
  const a = await fixture(),
    b = await fixture()
  await writeFile(join(b.root, 'secret.txt'), 'outside')
  await symlink(b.root, join(a.root, 'escape'))
  await expect(allowedPath(join(b.root, 'secret.txt'), a.roots)).rejects.toMatchObject({
    status: 403,
  })
  await expect(
    readFileView(join(a.root, 'escape/secret.txt'), a.roots, defaults),
  ).rejects.toMatchObject({ status: 403 })
  const expanded = await rootsFor(a.root, { ...defaults, extraRoots: [b.root] })
  expect((await readFileView(join(a.root, 'escape/secret.txt'), expanded, defaults)).content).toBe(
    'outside',
  )
  await expect(allowedPath(join(a.root, '../elsewhere'), a.roots)).rejects.toMatchObject({
    status: 403,
  })
})
it('limits directories and reads, and distinguishes binary/image/missing files', async () => {
  const { root, roots } = await fixture()
  await mkdir(join(root, 'folder'))
  await writeFile(join(root, 'a.txt'), '123456')
  await writeFile(join(root, 'b.bin'), Buffer.from([0, 255]))
  await writeFile(join(root, 'c.png'), Buffer.from([137, 80, 78, 71]))
  expect(
    (await listDirectory(root, roots, { ...defaults, maxDirectoryEntries: 2 })).truncated,
  ).toBe(true)
  expect(
    (await readFileView(join(root, 'a.txt'), roots, { ...defaults, maxTextBytes: 2 })).kind,
  ).toBe('large')
  expect((await readFileView(join(root, 'b.bin'), roots, defaults)).kind).toBe('binary')
  expect((await readFileView(join(root, 'c.png'), roots, defaults)).mime).toBe('image/png')
  await expect(readFileView(join(root, 'missing'), roots, defaults)).rejects.toMatchObject({
    code: 'ENOENT',
  })
  await expect(readFileView(join(root, 'folder'), roots, defaults)).rejects.toMatchObject({
    status: 400,
  })
})
