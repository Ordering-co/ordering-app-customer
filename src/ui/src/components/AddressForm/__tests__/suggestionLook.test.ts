import { defaultAppTheme } from '../../../../../theme/engine'
import { suggestionLook } from '../suggestionLook'

describe('suggestionLook', () => {
  it('is a menu: its background, radius and item height', () => {
    const theme: any = defaultAppTheme()
    const menu = theme.native.components.menu.base
    const look = suggestionLook(theme)
    expect(look.list).toMatchObject({ backgroundColor: menu.background, borderRadius: menu.radius })
    expect(look.item).toMatchObject({ minHeight: menu.item_height, paddingHorizontal: menu.padding_x })
  })
})
