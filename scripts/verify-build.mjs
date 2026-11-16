import assert from 'node:assert/strict'
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const html = await readFile('dist/index.html','utf8')
assert(html.includes('<title>MONO') && html.includes('name="description"') && html.includes('<noscript>'))
const assets = [...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(match=>match[1])
assert(assets.length>=3,'Expected relative scripts, styles, and favicon')
for (const asset of assets) assert((await stat(path.join('dist',asset))).isFile(),asset+' exists')
assert(!/(?:src|href)="\/assets\//.test(html),'Root-absolute assets break subdirectory hosting')
assert((await stat('dist/licenses/space-grotesk-OFL.txt')).isFile(),'Font license ships with output')
const chunks=[]
for (const name of await readdir('dist/assets')) {
  if (!/\.(js|css)$/.test(name)) continue
  const bytes=await readFile(path.join('dist/assets',name))
  chunks.push({name,bytes:bytes.length,gzip:gzipSync(bytes).length})
}
const entry=chunks.find(chunk=>/^index-.*\.js$/.test(chunk.name))
assert(entry && chunks.some(chunk=>/^ProductScene-.*\.js$/.test(chunk.name)),'Scene retains a separate chunk')
assert(/import\(["'`]\.\/ProductScene-/.test(await readFile(path.join('dist/assets',entry.name),'utf8')),'Scene loads through dynamic import')
await mkdir('test-results',{recursive:true})
await writeFile('test-results/build-report.json',JSON.stringify({passed:true,assets,chunks},null,2))
console.log('Verified relative asset paths, metadata, font license, and lazy scene chunk.')
