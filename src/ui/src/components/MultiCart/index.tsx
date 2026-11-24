import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton'
import { useTheme } from 'styled-components/native';
import { MultiCartCreate } from '@components'

import { Container } from '../../layouts/Container';
import { ChContainer, ChSection, ChUserDetails } from '../Checkout/styles'
import { themeGutter, themePart, themeSpace } from '@/theme/helpers'

// Skeleton boxes are layout (the size of the blocks they stand for).
const LINE = 20
const BLOCK = 120

export const MultiCartUI = () => {
  const theme: any = useTheme();
  const styles = useMemo(() => {
    const band = themePart(theme, 'divider', 'variants.band.line')
    const bleed = themeGutter(theme) + themeGutter(theme)
    return StyleSheet.create({
      page: { paddingHorizontal: themeGutter(theme) },
      gap: { marginBottom: themeSpace(theme, 'lg') },
      // A full-bleed band: out of both page gutters.
      band: { height: band.borderWidth, backgroundColor: band.borderColor, marginHorizontal: -bleed, marginBottom: themeSpace(theme, 'lg') },
      block: { marginBottom: themeSpace(theme, 'lg'), borderRadius: themePart(theme, 'skeleton', 'base.radius') }
    })
  }, [theme])
  return (
    <Container noPadding>
      <ChContainer style={styles.page}>
        <ChSection>
          <ChUserDetails>
            <Placeholder Animation={Fade}>
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} style={styles.gap} />
            </Placeholder>
            <View style={styles.band} />
            <Placeholder Animation={Fade}>
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} style={styles.gap} />
            </Placeholder>
            <View style={styles.band} />
            <Placeholder Animation={Fade}>
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={BLOCK} style={styles.block} />
              <PlaceholderLine height={LINE} />
              <PlaceholderLine height={LINE} />
            </Placeholder>
          </ChUserDetails>
        </ChSection>
      </ChContainer>
    </Container>
  )
}

export const MultiCart = (props: any) => {
  const mulcartProps = {
    ...props,
    UIComponent: MultiCartUI
  }
  return <MultiCartCreate {...mulcartProps} />
}
