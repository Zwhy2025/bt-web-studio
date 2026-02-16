#!/usr/bin/env node
/**
 * Find files under src/ that are never imported/referenced starting from src/main.tsx.
 * - Resolves path alias '@/'
 * - Handles TS/TSX/JS/JSX imports, dynamic imports, and re-exports
 * - Handles CSS @import
 * - Resolves extensionless imports and index files
 */
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const SRC = path.join(projectRoot, 'src')

/** Collect all files under src */
function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

/** Return true if file should be tracked in graph */
function isTrackable(file) {
  // Consider code, styles, json as trackable. Skip map files and assets for now.
  return /(\.(tsx?|jsx?)|\.(css)|\.json)$/i.test(file)
}

/** Extract import specifiers from a TS/JS file contents */
function parseImportsFromCode(src) {
  const specs = new Set()
  // Remove block comments to reduce false positives
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '')
  // Side-effect imports like: import "./globals.css"
  const sideEffectRe = /(^|\n)\s*import\s+['"]([^'"\n]+)['"]/gm
  // Any ... from "..." (works across multi-line import lists)
  const fromRe = /from\s+['"]([^'"\n]+)['"]/g
  // Dynamic imports
  const dynamicRe = /import\(\s*['"]([^'"\n]+)['"]\s*\)/g
  let m
  while ((m = sideEffectRe.exec(noBlock))) specs.add(m[2])
  while ((m = fromRe.exec(noBlock))) specs.add(m[1])
  while ((m = dynamicRe.exec(noBlock))) specs.add(m[1])
  return Array.from(specs)
}

/** Extract @import specifiers from CSS */
function parseImportsFromCss(src) {
  const specs = new Set()
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '')
  const cssImportRe = /@import\s+(?:url\()?['"]?([^'"\)\n]+)['"]?\)?\s*;/g
  let m
  while ((m = cssImportRe.exec(noBlock))) specs.add(m[1])
  return Array.from(specs)
}

/** Resolve a specifier to a file under src, if possible */
function resolveImport(fromFile, spec) {
  // External or absolute URL
  if (/^(?:https?:)?\/\//.test(spec)) return null
  // Bare module (react, etc.)
  if (!spec.startsWith('.') && !spec.startsWith('@/') && !spec.startsWith('/')) return null

  let target
  if (spec.startsWith('@/')) {
    target = path.join(SRC, spec.slice(2))
  } else if (spec.startsWith('/')) {
    // treat as project absolute
    target = path.join(projectRoot, spec.replace(/^\//, ''))
  } else {
    target = path.resolve(path.dirname(fromFile), spec)
  }

  const candidates = []

  // If target has an extension and exists
  if (path.extname(target)) {
    if (fs.existsSync(target)) return path.normalize(target)
  } else {
    // Try with common extensions
    const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css']
    for (const ext of exts) candidates.push(target + ext)
    // Try index files
    for (const ext of exts) candidates.push(path.join(target, 'index' + ext))
  }

  for (const c of candidates) if (fs.existsSync(c)) return path.normalize(c)
  return null
}

/** Build import graph */
function buildGraph() {
  const allFiles = walk(SRC).filter(isTrackable)
  const graph = new Map() // file -> set(imported files)
  const byPath = new Set(allFiles.map(p => path.normalize(p)))

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase()
    let specs = []
    try {
      const content = fs.readFileSync(file, 'utf8')
      if (ext === '.css') specs = parseImportsFromCss(content)
      else specs = parseImportsFromCode(content)
    } catch (e) {
      specs = []
    }
    const resolved = new Set()
    for (const s of specs) {
      const r = resolveImport(file, s)
      if (r && byPath.has(path.normalize(r))) resolved.add(path.normalize(r))
    }
    graph.set(path.normalize(file), resolved)
  }
  return { graph, allFiles: new Set(Array.from(byPath)) }
}

/** Traverse from entry(s) */
function traverse(graph, entries) {
  const visited = new Set()
  const q = [...entries]
  while (q.length) {
    const cur = q.shift()
    if (!cur || visited.has(cur)) continue
    visited.add(cur)
    const deps = graph.get(cur)
    if (!deps) continue
    for (const d of deps) if (!visited.has(d)) q.push(d)
  }
  return visited
}

function main() {
  const { graph, allFiles } = buildGraph()
  const entry = path.normalize(path.join(SRC, 'main.tsx'))
  if (!fs.existsSync(entry)) {
    console.error('Entry src/main.tsx not found')
    process.exit(1)
  }
  const visited = traverse(graph, [entry])

  // Include any style imported via index.html -> main.tsx -> globals.css chain is covered.

  // Filter out test files and type-only d.ts (none here), and vite env files if any
  const isIgnorable = (p) => {
    if (!p.startsWith(SRC)) return true
    const rel = path.relative(SRC, p)
    if (rel.startsWith('__tests__')) return true
    return false
  }

  const unused = Array.from(allFiles)
    .filter(p => !isIgnorable(p))
    .filter(p => !visited.has(p))
    .sort()

  console.log('Unused files under src (not reachable from src/main.tsx):')
  for (const f of unused) console.log(path.relative(projectRoot, f))
}

// Execute when run directly
main()
