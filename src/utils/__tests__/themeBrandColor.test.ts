import { themeBrandColor } from '../themeBrandColor'
import { buildAppTheme } from '@/theme/engine'
import { themeColor } from '@/theme/helpers'

describe('themeBrandColor', () => {
  it('uses the primary color token and ignores the old primary button color', () => {
    const theme = {
      ...buildAppTheme({ version: 2, values: { tokens: { color: { primary: '#FE0000' } } } }),
      my_products: { components: { theme_settings: { components: { style: { primary_btn_color: '#2C7BE5' } } } } }
    }
    expect(themeBrandColor(theme)).toBe(themeColor(theme, 'primary'))
    expect(themeBrandColor(theme).toUpperCase()).toBe('#FE0000')
    expect(themeBrandColor(theme)).not.toBe('#2C7BE5')
  })
})
