import * as React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TemplateApp from './src/TemplateApp'
import { ProjectSetupGate } from './src/project-setup-gate'
import { NativeFeatures, setNativeFeatures } from './src/utils/nativeKeys'

/** `nativeFeatures`: what the optional native keys allow (AppDelegate.swift, MainActivity.kt; src/utils/nativeKeys.ts). */
const App = ({ nativeFeatures }: { nativeFeatures?: NativeFeatures }) => {
  setNativeFeatures(nativeFeatures)
  return (
    <SafeAreaProvider>
      <ProjectSetupGate><TemplateApp /></ProjectSetupGate>
    </SafeAreaProvider>
  )
}

export default App
