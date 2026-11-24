import { StyleSheet } from 'react-native'
import { defaultAppTheme } from '../theme/engine'
import { themeBorderWidth, themeColor, themeSpace, themeText } from '../theme/helpers'

// This gate mounts before the remote theme is available.
const theme = defaultAppTheme()

export const localProjectBannerStyles = StyleSheet.create({
  header: {
    paddingHorizontal: themeSpace(theme, 'md'),
    paddingBottom: themeSpace(theme, 'sm'),
    backgroundColor: themeColor(theme, 'surface'),
    borderBottomWidth: themeBorderWidth(theme, 'thin'),
    borderBottomColor: themeColor(theme, 'border')
  },
  title: { ...themeText(theme, 'label'), color: themeColor(theme, 'text') },
  detail: { ...themeText(theme, 'caption'), color: themeColor(theme, 'text_muted'), marginTop: themeSpace(theme, 'xs') }
})

export const projectSetupStyles = StyleSheet.create({
  preview: { flex: 1 },
  previewBody: { flex: 1 },
  container: { flex: 1, padding: themeSpace(theme, 'xl'), justifyContent: 'center', backgroundColor: themeColor(theme, 'background') },
  title: { ...themeText(theme, 'h3'), marginBottom: themeSpace(theme, 'md'), color: themeColor(theme, 'text') },
  description: { ...themeText(theme, 'body'), marginBottom: themeSpace(theme, 'xl'), color: themeColor(theme, 'text_muted') }
})
