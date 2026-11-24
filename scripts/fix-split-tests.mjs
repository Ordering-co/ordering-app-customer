#!/usr/bin/env node
/**
 * Fixes imports after split-batch-tests.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const PAGE_ALIASES = {
  'Checkout.test.tsx': "import CheckoutPage from '../Checkout'\n",
  'Languages.test.tsx': "import LanguagesPage from '../Languages'\n",
  'Notifications.test.tsx': "import NotificationsList from '../Notifications'\n"
}

function walk (dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.test.tsx')) files.push(full)
  }
  return files
}

function jestHelperImport (filePath) {
  const dir = path.dirname(filePath)
  const rel = path.relative(dir, path.join(ROOT, 'jest/helpers/renderWithProviders.tsx'))
  const posix = rel.split(path.sep).join('/')
  return `import { renderWithProviders } from '${posix.replace(/\.tsx$/, '')}'\n`
}

function fixFile (filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  const base = path.basename(filePath)

  if (PAGE_ALIASES[base]) {
    const aliasImport = PAGE_ALIASES[base].trim()
    if (!content.includes(aliasImport)) {
      content = content.replace(/^import \w+ from '\.\.\/[^']+'\n/m, PAGE_ALIASES[base])
      changed = true
    }
  }

  if (content.includes('renderWithProviders') && !content.includes("from '") && !content.match(/import\s*\{[^}]*renderWithProviders/)) {
    // fallback - check properly
  }

  if (content.includes('renderWithProviders') && !content.match(/import\s*\{[^}]*renderWithProviders[^}]*\}/)) {
    const importLine = jestHelperImport(filePath)
    const lastImport = content.lastIndexOf('\nimport ')
    const insertAt = content.indexOf('\n', lastImport === -1 ? 0 : lastImport) + 1
    if (lastImport !== -1) {
      const nextNewline = content.indexOf('\n\n', lastImport)
      const at = nextNewline !== -1 ? nextNewline + 1 : content.indexOf('\n', lastImport) + 1
      content = content.slice(0, at) + importLine + content.slice(at)
    } else {
      content = importLine + content
    }
    changed = true
  }

  if (changed) {
    fs.writeFileSync(filePath, content)
    console.log('fixed', path.relative(ROOT, filePath))
  }
}

for (const file of walk(path.join(ROOT, 'src'))) {
  fixFile(file)
}

console.log('Done.')
