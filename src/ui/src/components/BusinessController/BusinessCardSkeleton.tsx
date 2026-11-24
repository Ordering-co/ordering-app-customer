import React, { useMemo } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'

import { nativeTextStyle } from '@/theme/helpers'
import { businessCardStyles } from './styles'
import { useBusinessCardVisibility } from './BusinessCard'

interface Props {
  variant?: 'default' | 'compact'
  /** Header height: `listing` (the main list) or the card's own. */
  headerSize?: 'listing' | 'card'
  /** A narrow card (carousels): no logo. */
  narrow?: boolean
  count?: number
  style?: StyleProp<ViewStyle>
}

const MAX_CARDS = 50

/**
 * The loading shape of a business card: the card's own box, header, logo and
 * text lines (`components.business_card`), painted with `components.skeleton`.
 */
export const BusinessCardSkeleton = ({ variant = 'default', headerSize = 'card', narrow, count = 1, style }: Props) => {
  const theme: any = useTheme()
  const card = useMemo(() => businessCardStyles(theme), [theme])
  const visible = useBusinessCardVisibility()
  const skeleton = theme.native.components.skeleton.base

  const styles = useMemo(() => {
    const look = theme.native.components.business_card.base
    const block = theme.native.components.skeleton.base
    return StyleSheet.create({
    block: { backgroundColor: block.color, borderRadius: block.radius },
    cover: { height: headerSize === 'listing' ? look.header_height_listing : look.header_height },
    logo: { width: look.logo_size, height: look.logo_size, borderRadius: look.radius, backgroundColor: block.color },
    // The text column spaces its lines (`card.info`'s gap): a line carries no margin of its own,
    // so the skeleton is as tall as the card it stands for.
    line: { borderRadius: block.radius },
    name: { height: nativeTextStyle(look.name).lineHeight },
    meta: { height: nativeTextStyle(look.meta).lineHeight }
    })
  }, [theme, headerSize])

  // A count that is not a whole number of cards (a negative one from a list with repeated pages) throws in `Array`.
  const cards = Number.isFinite(count) ? Math.min(Math.max(Math.floor(count), 0), MAX_CARDS) : 1
  const isCompact = variant === 'compact'
  const lines = (
    <View style={card.info}>
      <PlaceholderLine width={60} color={skeleton.color} noMargin style={[styles.line, styles.name]} />
      <PlaceholderLine width={40} color={skeleton.color} noMargin style={[styles.line, styles.meta]} />
      {!narrow && <PlaceholderLine width={80} color={skeleton.color} noMargin style={[styles.line, styles.meta]} />}
    </View>
  )
  const logo = visible.logo && !narrow && <View style={styles.logo} />

  return (
    <>
      {Array.from({ length: cards }, (_, i) => i).map(i => (
        <Placeholder key={i} Animation={Fade} style={[isCompact ? card.compact : card.card, style]}>
          {!isCompact && visible.header && <View style={[card.hero, styles.block, styles.cover]} />}
          <View style={isCompact ? card.row : card.body}>
            {logo}
            {lines}
          </View>
        </Placeholder>
      ))}
    </>
  )
}
