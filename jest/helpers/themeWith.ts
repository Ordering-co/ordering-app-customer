import { buildAppTheme } from '../../src/theme/engine'

type ThemeValues = {
  tokens?: Record<string, unknown>
  components?: Record<string, unknown>
  visibility?: Record<string, boolean>
  images?: Record<string, string>
  pages?: Record<string, unknown>
}

export const themeWith = (values: ThemeValues): any => buildAppTheme({ version: 2, values })

export const withTheme = (values: ThemeValues) => ({ themeOverrides: themeWith(values) as Record<string, unknown> })
