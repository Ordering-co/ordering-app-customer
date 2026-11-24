#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const M1_IMPORT_FIX = {
  "import { LoginForm } from '../LoginForm'": "import { LoginForm } from '..'",
  "import { Otp } from '../LoginForm/Otp'": "import { Otp } from '..'",
  "import { ForgotPasswordForm } from '../ForgotPasswordForm'": "import { ForgotPasswordForm } from '..'",
  "import { SignupForm } from '../SignupForm'": "import { SignupForm } from '..'",
  "import { UserVerification } from '../UserVerification'": "import { UserVerification } from '..'",
  "import { VerifyPhone } from '../VerifyPhone'": "import { VerifyPhone } from '..'",
  "import { Sessions } from '../Sessions'": "import { Sessions } from '..'",
  "import { AppleLogin } from '../AppleLogin'": "import { AppleLogin } from '..'",
  "import { GoogleLogin } from '../GoogleLogin'": "import { GoogleLogin } from '..'",
  "import { FacebookLogin } from '../FacebookLogin'": "import { FacebookLogin } from '..'",
  "import { LanguageSelector } from '../LanguageSelector'": "import { LanguageSelector } from '..'",
  "import { Languages } from '../Languages'": "import { Languages } from '..'",
  "import { LogoutButton } from '../LogoutButton'": "import { LogoutButton } from '..'",
  "import { ProjectForm } from '../ProjectForm'": "import { ProjectForm } from '..'"
}

function walk (dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.test.tsx')) files.push(full)
  }
  return files
}

for (const file of walk(path.join(ROOT, 'src/ui/src/components'))) {
  let content = fs.readFileSync(file, 'utf8')
  let changed = false
  for (const [from, to] of Object.entries(M1_IMPORT_FIX)) {
    if (content.includes(from)) {
      content = content.split(from).join(to)
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(file, content)
    console.log('fixed', path.relative(ROOT, file))
  }
}

console.log('M1 import fix done.')
