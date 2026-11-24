#!/usr/bin/env node
/**
 * Splits monolithic batch Jest files into one test file per unit.
 * Run: node scripts/split-batch-tests.mjs [--dry-run]
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const DRY_RUN = process.argv.includes('--dry-run')

const PAGE_NAME_MAP = {
  CheckoutPage: 'Checkout',
  LanguagesPage: 'Languages',
  NotificationsList: 'Notifications'
}

const M1_IMPORTS = {
  LoginForm: "import { LoginForm } from '..'",
  Otp: "import { Otp } from '..'",
  ForgotPasswordForm: "import { ForgotPasswordForm } from '..'",
  SignupForm: "import { SignupForm } from '..'",
  UserVerification: "import { UserVerification } from '..'",
  VerifyPhone: "import { VerifyPhone } from '..'",
  Sessions: "import { Sessions } from '..'",
  AppleLogin: "import { AppleLogin } from '..'",
  GoogleLogin: "import { GoogleLogin } from '..'",
  FacebookLogin: "import { FacebookLogin } from '..'",
  LanguageSelector: "import { LanguageSelector } from '..'",
  Languages: "import { Languages } from '..'",
  LogoutButton: "import { LogoutButton } from '..'",
  ProjectForm: "import { ProjectForm } from '..'"
}

const M2_IMPORTS = {
  NavBar: "import NavBar from '..'",
  BottomWrapper: "import BottomWrapper from '..'",
  NetworkError: "import { NetworkError } from '..'",
  NotFoundSource: "import { NotFoundSource } from '..'",
  WebsocketStatus: "import { WebsocketStatus } from '..'",
  CookieConsentBanner: "import { CookieConsentBanner } from '..'",
  FloatingButton: "import { FloatingButton } from '..'",
  PageBanner: "import { PageBanner } from '..'",
  PoweredBy: "import { PoweredBy } from '..'",
  NotificationSetting: "import { NotificationSetting } from '..'",
  NotificationsList: "import { NotificationsList } from '..'",
  AnimatedItem: "import { AnimatedItem } from '..'",
  LottieAnimation: "import { LottieAnimation } from '..'",
  Home: "import { Home } from '..'",
  Help: "import { Help } from '..'",
  HelpOptions: "import { HelpOptions } from '..'"
}

const M2_FOLDER_MAP = {
  NavBar: 'NavBar',
  BottomWrapper: 'BottomWrapper',
  NetworkError: 'NetworkError',
  NotFoundSource: 'NotFoundSource',
  WebsocketStatus: 'WebsocketStatus',
  CookieConsentBanner: 'CookieConsentBanner',
  FloatingButton: 'FloatingButton',
  PageBanner: 'PageBanner',
  PoweredBy: 'PoweredBy',
  NotificationSetting: 'NotificationSetting',
  NotificationsList: 'Notifications',
  AnimatedItem: 'AnimatedItem',
  LottieAnimation: 'LottieAnimation',
  Home: 'Home',
  Help: 'Help',
  HelpOptions: 'HelpOptions'
}

const M1_FOLDER_MAP = {
  LoginForm: 'LoginForm',
  Otp: 'LoginForm/Otp',
  ForgotPasswordForm: 'ForgotPasswordForm',
  SignupForm: 'SignupForm',
  UserVerification: 'UserVerification',
  VerifyPhone: 'VerifyPhone',
  Sessions: 'Sessions',
  AppleLogin: 'AppleLogin',
  GoogleLogin: 'GoogleLogin',
  FacebookLogin: 'FacebookLogin',
  LanguageSelector: 'LanguageSelector',
  Languages: 'Languages',
  LogoutButton: 'LogoutButton',
  ProjectForm: 'ProjectForm'
}

const SHARED_NAME_MAP = {
  'Toast (OToast)': 'OToast',
  'shared index exports': 'index',
  'styles (via modal chrome)': 'styles'
}

function findBraceEnd (content, startIdx) {
  let depth = 0
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  throw new Error(`Unmatched brace at ${startIdx}`)
}

function extractInnerDescribes (outerBody) {
  const describes = []
  const regex = /describe\s*\(\s*['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\{/g
  let match
  while ((match = regex.exec(outerBody)) !== null) {
    const name = match[1]
    const braceStart = match.index + match[0].length - 1
    const braceEnd = findBraceEnd(outerBody, braceStart)
    const body = outerBody.slice(braceStart + 1, braceEnd).trim()
    describes.push({ name, body })
    regex.lastIndex = braceEnd + 1
  }
  return describes
}

function parseBatchFile (filePath) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf8')
  const outerMatch = content.match(/describe\s*\(\s*['"][^'"]+['"]\s*,\s*\(\)\s*=>\s*\{/)
  if (!outerMatch) throw new Error(`No outer describe in ${filePath}`)
  const outerStart = outerMatch.index
  const braceStart = outerMatch.index + outerMatch[0].length - 1
  const braceEnd = findBraceEnd(content, braceStart)
  const header = content.slice(0, outerStart).trimEnd()
  const outerBody = content.slice(braceStart + 1, braceEnd)
  const firstInner = outerBody.search(/describe\s*\(\s*['"]/)
  const setup = firstInner === -1 ? outerBody.trim() : outerBody.slice(0, firstInner).trim()
  const describes = firstInner === -1 ? [] : extractInnerDescribes(outerBody.slice(firstInner))
  return { header, setup, describes }
}

function stripPageImports (header) {
  return header
    .split('\n')
    .filter((line) => !line.match(/^import\s+\w+\s+from\s+['"]\.\.\//))
    .join('\n')
}

function relJestHelper (fromDir) {
  const rel = path.relative(fromDir, path.join(ROOT, 'jest/helpers'))
  return rel.split(path.sep).join('/')
}

function rewriteHeaderPaths (header, oldPrefix, newPrefix) {
  return header.split(oldPrefix).join(newPrefix)
}

function writeFile (filePath, content) {
  if (DRY_RUN) {
    console.log(`[dry-run] would write ${filePath}`)
    return
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content + '\n')
  console.log(`wrote ${path.relative(ROOT, filePath)}`)
}

function splitPages (batchFile) {
  const { header, setup, describes } = parseBatchFile(batchFile)
  const baseHeader = stripPageImports(header)

  for (const { name, body } of describes) {
    const pageFile = PAGE_NAME_MAP[name] || name
    const outDir = path.join(ROOT, 'src/pages/__tests__')
    const outPath = path.join(outDir, `${pageFile}.test.tsx`)
    const helperPrefix = relJestHelper(outDir)
    let fileHeader = rewriteHeaderPaths(baseHeader, '../../../jest/helpers', `${helperPrefix}`)
    fileHeader += `\n\nimport ${pageFile} from '../${pageFile}'\n`
    const content = `${fileHeader}\n\n${setup}\n\ndescribe('${name}', () => {\n${body.split('\n').map((l) => `  ${l}`).join('\n')}\n})\n`
    writeFile(outPath, content)
  }
}

function splitM1 () {
  const batchFile = 'src/ui/src/components/__tests__/m1-auth.test.tsx'
  const { header, setup, describes } = parseBatchFile(batchFile)
  const baseHeader = header
    .split('\n')
    .filter((line) => !line.match(/^import\s+.*from\s+['"]\.\.\/[^j]/))
    .join('\n')

  for (const { name, body } of describes) {
    const folder = M1_FOLDER_MAP[name]
    const outDir = path.join(ROOT, 'src/ui/src/components', folder, '__tests__')
    const outPath = path.join(outDir, `${name}.test.tsx`)
    const helperPrefix = relJestHelper(outDir)
    let fileHeader = rewriteHeaderPaths(baseHeader, '../../../../../jest/helpers', `${helperPrefix}`)
    fileHeader += `\n\n${M1_IMPORTS[name]}\n`
    const content = `${fileHeader}\n\n${setup}\n\ndescribe('${name}', () => {\n${body.split('\n').map((l) => `  ${l}`).join('\n')}\n})\n`
    writeFile(outPath, content)
  }
}

function splitM2 () {
  const batchFile = 'src/ui/src/components/__tests__/m2-shell.test.tsx'
  const { header, setup, describes } = parseBatchFile(batchFile)
  const baseHeader = header
    .split('\n')
    .filter((line) => !line.match(/^import\s+.*from\s+['"]\.\.\/[^j]/))
    .join('\n')

  for (const { name, body } of describes) {
    const folder = M2_FOLDER_MAP[name]
    const outDir = path.join(ROOT, 'src/ui/src/components', folder, '__tests__')
    const outPath = path.join(outDir, `${name}.test.tsx`)
    const helperPrefix = relJestHelper(outDir)
    let fileHeader = rewriteHeaderPaths(baseHeader, '../../../../../jest/helpers', `${helperPrefix}`)
    fileHeader = rewriteHeaderPaths(fileHeader, "jest.requireActual('@/ui/src/components/NotFoundSource')", "jest.requireActual('@/ui/src/components/NotFoundSource/index')")
    fileHeader = rewriteHeaderPaths(fileHeader, "jest.requireActual('@/ui/src/components/AnimatedItem')", "jest.requireActual('@/ui/src/components/AnimatedItem/index')")
    fileHeader = rewriteHeaderPaths(fileHeader, "jest.mock('../Help/functions'", "jest.mock('@/ui/src/components/Help/functions'")
    fileHeader += `\n\n${M2_IMPORTS[name]}\n`
    const content = `${fileHeader}\n\n${setup}\n\ndescribe('${name}', () => {\n${body.split('\n').map((l) => `  ${l}`).join('\n')}\n})\n`
    writeFile(outPath, content)
  }
}

function splitShared () {
  const batchFile = 'src/ui/src/components/shared/__tests__/shared.test.tsx'
  const { header, setup, describes } = parseBatchFile(batchFile)
  const baseHeader = header
    .split('\n')
    .filter((line) => !line.match(/^import\s+.*from\s+['"]\.\.\/[^j]/) && !line.match(/^import \* as SharedExports/))
    .join('\n')

  const sharedImports = {
    OButton: "import OButton from '../OButton'",
    OText: "import OText from '../OText'",
    OInput: "import OInput from '../OInput'",
    ODropDown: "import ODropDown from '../ODropDown'",
    OIcon: "import OIcon from '../OIcon'",
    OIconText: "import OIconText from '../OIconText'",
    OIconButton: "import OIconButton from '../OIconButton'",
    OTextarea: "import OTextarea from '../OTextarea'",
    OToggle: "import OToggle from '../OToggle'",
    OKeyButton: "import OKeyButton from '../OKeyButton'",
    OAlert: "import OAlert from '../OAlert'",
    OModal: "import OModal from '../OModal'",
    OBottomPopup: "import OBottomPopup from '../OBottomPopup'",
    OToast: "import { Toast } from '../OToast'",
    HeaderTitle: "import HeaderTitle from '../HeaderTitle'",
    CardAnimation: "import { CardAnimation } from '../CardAnimation'",
    index: "import * as SharedExports from '../index'",
    styles: "import OModal from '../OModal'"
  }

  const outDir = path.join(ROOT, 'src/ui/src/components/shared/__tests__')
  const helperPrefix = relJestHelper(outDir)

  for (const { name, body } of describes) {
    const fileName = SHARED_NAME_MAP[name] || name
    const outPath = path.join(outDir, `${fileName}.test.tsx`)
    let fileHeader = rewriteHeaderPaths(baseHeader, '../../../../../../jest/helpers', `${helperPrefix}`)
    if (sharedImports[fileName]) {
      fileHeader += `\n\n${sharedImports[fileName]}\n`
    }
    if (fileName === 'index') {
      fileHeader += "\nconst iconSource = 1\n"
    }
    if (fileName === 'styles' || fileName === 'OButton') {
      if (!fileHeader.includes('const iconSource')) {
        fileHeader += "\nconst iconSource = 1\n"
      }
    }
    const describeName = name
    const content = `${fileHeader}\n\n${setup}\n\ndescribe('${describeName}', () => {\n${body.split('\n').map((l) => `  ${l}`).join('\n')}\n})\n`
    writeFile(outPath, content)
  }
}

function deleteBatchFiles (files) {
  for (const file of files) {
    const full = path.join(ROOT, file)
    if (fs.existsSync(full)) {
      if (DRY_RUN) {
        console.log(`[dry-run] would delete ${file}`)
      } else {
        fs.unlinkSync(full)
        console.log(`deleted ${file}`)
      }
    }
  }
}

const pageBatches = [
  'src/pages/__tests__/p1-auth.test.tsx',
  'src/pages/__tests__/p2-discovery.test.tsx',
  'src/pages/__tests__/p3-product-cart.test.tsx',
  'src/pages/__tests__/p4-checkout-wallet.test.tsx',
  'src/pages/__tests__/p5-orders-reviews.test.tsx',
  'src/pages/__tests__/p6-profile-account.test.tsx',
  'src/pages/__tests__/p7-messages-help.test.tsx'
]

console.log('Splitting shared primitives (S0)...')
splitShared()

console.log('Splitting page batches (P1–P7)...')
for (const batch of pageBatches) {
  splitPages(batch)
}

console.log('Splitting M1 auth UI...')
splitM1()

console.log('Splitting M2 shell UI...')
splitM2()

deleteBatchFiles([
  ...pageBatches,
  'src/ui/src/components/shared/__tests__/shared.test.tsx',
  'src/ui/src/components/__tests__/m1-auth.test.tsx',
  'src/ui/src/components/__tests__/m2-shell.test.tsx'
])

console.log(DRY_RUN ? 'Dry run complete.' : 'Split complete.')
