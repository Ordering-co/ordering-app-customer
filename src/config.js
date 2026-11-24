/* global __DEV__ */
import source from './config.json'
import { getLocalSimulatorSettings, isLocalSimulatorMode } from './onboarding/ios-local-mode'
import { shouldRunProjectSetup } from './onboarding/tenant'
import { normalizeBusinessSlug } from './utils/businessSlug'

const settings = { ...getLocalSimulatorSettings(source), localSimulatorMode: isLocalSimulatorMode() }
if (shouldRunProjectSetup(settings, { isDev: __DEV__, localSimulator: settings.localSimulatorMode })) settings.use_root_point = false

const keysToNull = [
  'franchiseSlug'
]

keysToNull.forEach(key => {
  if (settings[key] === '0') {
    settings[key] = null
  };
})

settings.businessSlug = normalizeBusinessSlug(settings.businessSlug)

export const selectedProjectSettings = { ...settings, api: { ...settings.api }, socket: { ...settings.socket } }
export const setRuntimeFranchise = id => { settings.franchiseSlug = id }

export default settings
