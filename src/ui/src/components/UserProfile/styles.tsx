import styled from 'styled-components/native'
import { gutterCss, nativeBoxStyle, radiusCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`

export const Container = styled.View`
  flex: 1;
  height: 100%;
  padding-top: ${({ theme }: any) => px(theme.native.components.account_page.base.padding_top)};
`

export const WrapperOptions = styled.ScrollView`
  flex: 1;
`

// `components.card`: background, radius, border and shadow (both platforms).
export const QuickActionsContainer = styled.View.attrs(({ theme }: any) => ({
  style: nativeBoxStyle(theme.native.components.card.base)
}))`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  /* Under the page's top (\`account_page.padding_top\`) with no margin of its own: the
     title is as far from it as every other block from the next. */
  padding: ${({ theme }: any) => `${spaceCss(theme, 'sm')} ${spaceCss(theme, 'sm')}`};
  margin: ${({ theme }: any) => `${spaceCss(theme, 'none')} ${gutterCss(theme)}`};
  border-radius: ${({ theme }: any) => px(theme.native.components.card.base.radius)};
`

export const WrapperIcon = styled.View`
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  background-color: ${({ theme }: any) => theme.native.tokens.color.surface_alt};
`

// The blocks of the page are \`space.xl\` apart (the quick actions and every section alike).
export const Section = styled.View<{ last?: boolean }>`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
  margin-bottom: ${({ theme, last }: any) => spaceCss(theme, last ? 'lg' : 'none')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ListItemContent = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => px(theme.native.components.list_row.base.gap)};
`

export const AppInfo = styled.View`
  align-items: center;
`
