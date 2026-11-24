import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'

import OText from '../shared/OText'
import Icon from '../shared/Icon'
import { BusinessLogo } from '../shared/BusinessLogo'
import { PressableScale } from '../shared/PressableScale'
import { LottieAnimation } from '../LottieAnimation'
import { BusinessHeaderPlaceholder } from '../BusinessHeaderPlaceholder'
import { Ribbon } from '../SingleProductCard/Ribbon'
import { themeImage, themePart, themeVisible } from '@/theme/helpers'
import { businessCardStyles } from './styles'
import { imageUrl } from '@/utils/imageUrl'

/** The pieces of a business card the theme can hide (`business_card.*`). */
export const useBusinessCardVisibility = () => {
  const theme: any = useTheme()
  return useMemo(() => ({
    header: themeVisible(theme, 'business_card.header'),
    logo: themeVisible(theme, 'business_card.logo'),
    reviews: themeVisible(theme, 'business_card.reviews'),
    favorite: themeVisible(theme, 'business_card.favorite'),
    offer: themeVisible(theme, 'business_card.offer'),
    ribbon: themeVisible(theme, 'business_card.ribbon'),
    time: themeVisible(theme, 'business_card.time'),
    fee: themeVisible(theme, 'business_card.fee'),
    distance: themeVisible(theme, 'business_card.distance'),
    preorder: themeVisible(theme, 'business_card.preorder')
  }), [theme])
}

export interface BusinessCardProps {
  /** `default` (vertical, header image) or `compact` (a row: search, map, orders). */
  variant?: 'default' | 'compact'
  name?: string
  /** Header image source (a FastImage source), or null for the placeholder. */
  headerSource?: any
  logoUri?: string | null
  ribbon?: any
  rating?: string | null
  time?: string | null
  fee?: string | null
  distance?: string | null
  isOpen?: boolean
  /** Text of the offer tag ("Discount 10%"), or null. */
  offer?: string | null
  /** Text of the preorder tag, or null. */
  preorder?: string | null
  favorite?: { active?: boolean, onToggle: () => void, animated?: boolean } | null
  /** The header height: `listing` (the main list) or the card's own. */
  headerSize?: 'listing' | 'card'
  /** A narrow card (carousels): one line of name, no logo, rating beside the name. */
  narrow?: boolean
  closedLabel?: string
  onPress?: () => void
  optimizeImage?: (url: string, params: string) => string
  testID?: string
  accessibilityLabel?: string
  children?: React.ReactNode
}

/**
 * The app's business card: `components.business_card` and its visibility keys
 * (`business_card.header`, `logo`, `reviews`, `favorite`, `offer`, `ribbon`,
 * `time`, `fee`, `distance`, `preorder`), the same for both variants.
 */
export const BusinessCard = (props: BusinessCardProps) => {
  const {
    variant = 'default',
    name,
    headerSource,
    logoUri,
    ribbon,
    rating,
    time,
    fee,
    distance,
    isOpen = true,
    offer,
    preorder,
    favorite,
    headerSize = 'card',
    narrow,
    closedLabel,
    onPress,
    testID = 'business-card',
    accessibilityLabel,
    children
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => businessCardStyles(theme), [theme])
  const visible = useBusinessCardVisibility()
  const card = theme.native.components.business_card.base
  const favoriteLook = theme.native.components.favorite.base
  const ratingLook = theme.native.components.rating

  const isCompact = variant === 'compact'
  const headerHeight = headerSize === 'listing' ? card.header_height_listing : card.header_height
  const showHeader = !isCompact && visible.header
  const showLogo = !!logoUri && visible.logo && !narrow
  const showRating = !!rating && visible.reviews
  const tags = [
    visible.offer && offer,
    visible.preorder && preorder
  ].filter(Boolean) as string[]

  const ratingNode = showRating && (
    <View style={styles.rating}>
      <Icon name='star' size={ratingLook.sizes.sm.icon_size} color={ratingLook.base.color} />
      <OText style={styles.meta}>{rating}</OText>
    </View>
  )

  const favoriteNode = !!favorite && visible.favorite && !narrow && (
    <LottieAnimation
      type='favorite'
      onClick={favorite.onToggle}
      initialValue={favorite.active ? 0.5 : 0}
      toValue={favorite.active ? 0 : 0.5}
      disableAnimation={!favorite.animated}
      iconProps={{ color: favoriteLook.color, size: favoriteLook.icon_size }}
      isActive={!!favorite.active}
    />
  )

  const metaImages = card.meta_images === true
  const metaIcon = (imageKey: string, icon: React.ReactElement) => {
    const image = metaImages ? themeImage(theme, imageKey) : null
    return image
      ? <FastImage style={{ width: card.meta_icon_size, height: card.meta_icon_size }} source={image} objectFit='contain' />
      : icon
  }
  const metaParts: Record<string, React.ReactElement | false> = {
    time: visible.time && !!time && (
      <View key='time' style={styles.metaItem}>
        {metaIcon('icons.business_time', <Icon name='time-outline' size={card.meta_icon_size} color={card.meta_color} />)}
        <OText style={styles.meta}>{time}</OText>
      </View>
    ),
    fee: visible.fee && !!fee && (
      <View key='fee' style={styles.metaItem}>
        {metaIcon('icons.business_fee', <Icon set='mci' name='truck-delivery-outline' size={card.meta_icon_size} color={card.meta_color} />)}
        <OText style={styles.meta}>{fee}</OText>
      </View>
    ),
    distance: visible.distance && !!distance && !narrow && (
      <View key='distance' style={styles.metaItem}>
        {metaIcon('icons.business_distance', <Icon name='location-outline' size={card.meta_icon_size} color={card.meta_color} />)}
        <OText style={styles.meta}>{distance}</OText>
      </View>
    )
  }
  const metaOrder = card.meta_order === 'distance_first' ? ['distance', 'time', 'fee'] : ['time', 'fee', 'distance']
  const metaItems = !isOpen
    ? [<OText key='closed' style={styles.closed}>{closedLabel}</OText>]
    : metaOrder.map((key) => metaParts[key]).filter(Boolean) as React.ReactElement[]

  const meta = metaItems.length > 0 && (
    <View style={styles.metaRow}>
      {metaItems.map((item, index) => (
        <React.Fragment key={item.key ?? index}>
          {index > 0 && <OText style={styles.bullet}>•</OText>}
          {item}
        </React.Fragment>
      ))}
    </View>
  )

  const tagList = (onImage: boolean) => tags.length > 0 && (
    <View style={[styles.tags, onImage && styles.tagsOnImage]}>
      {tags.map(text => (
        <View key={text} style={styles.tag}>
          <OText style={styles.tagText} numberOfLines={1}>{text}</OText>
        </View>
      ))}
    </View>
  )

  const logo = showLogo && (
    <BusinessLogo
      uri={imageUrl(logoUri as string, { height: card.logo_size }) as string}
      size={card.logo_size}
      radius={card.radius}
      background={card.background}
      shadow={card.logo_shadow}
    />
  )

  const ribbonUnderName = themePart(theme, 'business_card', 'base.ribbon_position') === 'name'
  const ribbonNode = (onImage: boolean) => visible.ribbon && ribbon?.enabled && !!ribbon?.text && (
    <Ribbon ribbon={ribbon} style={onImage ? styles.ribbonOnImage : styles.ribbon} />
  )

  const info = (
    <View style={styles.info}>
      {(isCompact || !showHeader) && ribbonNode(false)}
      {(isCompact || !showHeader) && tagList(false)}
      <View style={styles.titleRow}>
        <OText style={styles.name} numberOfLines={narrow ? 1 : 2} ellipsizeMode='tail'>
          {name}
        </OText>
        {narrow ? ratingNode : favoriteNode}
      </View>
      {ribbonUnderName && !isCompact && showHeader && ribbonNode(false)}
      {!narrow && ratingNode}
      {meta}
    </View>
  )

  if (isCompact) {
    return (
      <View style={styles.compact} testID={testID}>
        <PressableScale onPress={onPress}>
          <View style={styles.row} accessibilityRole='button' accessibilityLabel={accessibilityLabel}>
            {logo}
            {info}
          </View>
        </PressableScale>
        {children}
      </View>
    )
  }

  return (
    <PressableScale onPress={onPress} style={styles.card} testID={testID}>
      {showHeader && (
        <View style={styles.hero}>
          {headerSource ? (
            <FastImage style={headerSize === 'listing' ? styles.coverListing : styles.cover} source={headerSource} objectFit='cover' />
          ) : (
            <BusinessHeaderPlaceholder
              logo={logoUri ?? undefined}
              name={name}
              height={headerHeight}
              borderRadius={0}
            />
          )}
          {!ribbonUnderName && ribbonNode(true)}
          {tagList(true)}
        </View>
      )}
      <View style={styles.body}>
        {logo}
        {info}
      </View>
      {children}
    </PressableScale>
  )
}
