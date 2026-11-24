import { SectionTitle } from '../shared/SectionTitle'
import { BusinessLogo } from '../shared/BusinessLogo'
import { FilterChip } from '../BusinessListingSearch/FilterChip'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import { LoadingOverlay } from '../LoadingOverlay'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OButton, OInput, OText, Icon } from '../shared'
import { FloatingBottomContainer } from '../../layouts/FloatingBottomContainer'
import { nativeBoxStyle, nativeShadowStyle, themeBottomSpace, nativeTextStyle, themeColor, themeControlHeight, themeGutter, themeSpace, themeVisible } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'

/**
 * The one review form (`components.review_form`) shared by the order, product
 * and driver reviews: header with a thumb, thumbs rating (`rating_scale`),
 * quick comments (`chip`), free comment (`input`) and the Continue bar
 * (`bottom_bar`). The `review` page's sections order and hide its blocks.
 */

/** Height of the free-comment box: a layout box (no theme size for a textarea). */
const TEXTAREA_LINES_HEIGHT = 100

const useReviewStyles = () => {
  const theme: any = useTheme()
  const insets = useSafeAreaInsets()
  return useMemo(() => {
    const form = theme.native.components.review_form.base
    const details = theme.native.components.order_details.base
    const card = theme.native.components.card.base
    const line = theme.native.components.divider.variants.item.line
    const bar = theme.native.components.bottom_bar.base
    // Room for the Continue bar pinned below: its button, its padding above and below, the inset.
    const barRoom = themeControlHeight(theme, 'md') + bar.padding + bar.padding + themeBottomSpace(theme, insets.bottom) + form.gap
    return StyleSheet.create({
      // The page starts under the bar as every screen does (\`space.lg\`).
      content: {
        paddingHorizontal: themeGutter(theme),
        paddingTop: themeSpace(theme, 'lg'),
        paddingBottom: barRoom,
      },
      header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: themeSpace(theme, 'sm') },
      headerText: { flex: 1 },
      title: { ...nativeTextStyle(form.title), color: form.title_color },
      thumbs: { alignItems: 'flex-end', gap: themeSpace(theme, 'xs') },
      thumb: {
        width: details.business_logo_size,
        height: details.business_logo_size,
        borderRadius: details.business_logo_radius,
        backgroundColor: card.background,
        ...nativeShadowStyle(card.shadow),
      },
      thumbImage: { width: details.business_logo_size, height: details.business_logo_size, borderRadius: details.business_logo_radius },
      block: { marginTop: form.gap },
      rule: { marginTop: form.gap, borderTopWidth: line.borderWidth, borderTopColor: line.borderColor },
      rating: { flexDirection: 'row', gap: themeSpace(theme, 'md') },
      chips: { flexDirection: 'row', flexWrap: 'wrap', gap: themeSpace(theme, 'sm') },
      reviewed: { flexDirection: 'row', justifyContent: 'center', marginVertical: form.gap },
      textarea: { height: TEXTAREA_LINES_HEIGHT, alignItems: 'flex-start' },
      full: { width: '100%' },
    })
  }, [theme, insets.bottom])
}

/** The scroll content's padding: the page gutter and room for the Continue bar. */
export const useReviewContentStyle = () => useReviewStyles().content

interface HeaderProps { title: string, subtitle?: string | null, children?: React.ReactNode }

export const ReviewHeader = ({ title, subtitle, children }: HeaderProps) => {
  const styles = useReviewStyles()
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <OText style={styles.title}>{title}</OText>
        {!!subtitle && <OText preset='body'>{subtitle}</OText>}
      </View>
      {!!children && <View style={styles.thumbs}>{children}</View>}
    </View>
  )
}

/** A business logo, product image or driver photo next to the header. */
export const ReviewThumb = ({ uri, fallback, testID }: { uri?: string | null, fallback?: any, testID?: string }) => {
  const styles = useReviewStyles()
  const theme: any = useTheme()
  // A business logo: the business cards' frame (and the theme's placeholder without one).
  if (!fallback) {
    const frame = theme.native.components.business_card.base
    return (
      <BusinessLogo
        testID={testID}
        uri={uri || null}
        size={theme.native.components.order_details.base.business_logo_size}
        radius={frame.radius}
        background={frame.background}
        shadow={frame.logo_shadow}
      />
    )
  }
  const source = uri ? { uri, priority: FastImage.priority.normal } : fallback
  return (
    <View style={styles.thumb} testID={testID}>
      {!!source && <FastImage style={styles.thumbImage} source={source} objectFit='cover' />}
    </View>
  )
}

export const ReviewedNotice = ({ text }: { text: string }) => {
  const styles = useReviewStyles()
  return (
    <View style={styles.reviewed}>
      <OText color='primary_text'>{text}</OText>
    </View>
  )
}

/** Like (5) or dislike (1): `rating_scale` in thumbs mode. */
export const ThumbsRating = ({ value, onChange, likeLabel, dislikeLabel }: { value: number, onChange: (value: number) => void, likeLabel: string, dislikeLabel: string }) => {
  const theme: any = useTheme()
  const styles = useReviewStyles()
  const scale = theme.native.components.rating_scale.base
  const thumb = (selected: boolean, name: string) => (
    <Icon name={selected ? name : `${name}-outline`} size='lg' color={selected ? scale.fill : scale.mark} />
  )
  return (
    <View style={styles.rating}>
      <OButton
        iconOnly
        size='lg'
        color='neutral'
        appearance='outline'
        icon={thumb(value === 5, 'thumbs-up')}
        accessibilityLabel={likeLabel}
        onClick={() => onChange(5)}
      />
      <OButton
        iconOnly
        size='lg'
        color='neutral'
        appearance='outline'
        icon={thumb(value === 1, 'thumbs-down')}
        accessibilityLabel={dislikeLabel}
        onClick={() => onChange(1)}
      />
    </View>
  )
}

/** A choice chip (`components.chip`, size `sm`, state `selected`). */
/** A choice chip: the app's chip (\`FilterChip\`, \`components.chip\`, state \`selected\`). */
export const ReviewChip = ({ text, selected = false, onPress, size = 'sm', testID }: { text: string, selected?: boolean, onPress?: () => void, size?: 'sm' | 'md' | 'lg', testID?: string }) => (
  <FilterChip testID={testID} text={text} selected={selected} onPress={onPress} size={size} />
)

interface QuickCommentsProps {
  title?: string
  items?: Array<{ key: number, content: string }>
  isSelected: (key: number) => boolean
  onToggle: (item: any) => void
}

export const QuickComments = ({ title, items, isSelected, onToggle }: QuickCommentsProps) => {
  const styles = useReviewStyles()
  const theme: any = useTheme()
  // The quick comments' size: `review_form.slots.chip`.
  const chipSize = theme.native.components.review_form.slots.chip.size
  return (
    <>
      <View style={styles.rule} />
      <View style={styles.block}>
        {!!title && <SectionTitle>{title}</SectionTitle>}
        <View style={styles.chips}>
          {items?.map((item) => (
            <ReviewChip key={item.key} size={chipSize} text={item.content} selected={!!isSelected(item.key)} onPress={() => onToggle(item)} />
          ))}
        </View>
      </View>
    </>
  )
}

export const CommentField = ({ label, placeholder, onChange }: { label: string, placeholder: string, onChange: (value: string) => void }) => {
  const styles = useReviewStyles()
  return (
    <>
      <View style={styles.rule} />
      <View style={styles.block}>
        <SectionTitle>{label}</SectionTitle>
        <OInput
          name='comments'
          placeholder={placeholder}
          onChange={(val: any) => onChange(val.target.value)}
          style={styles.textarea}
          multiline
        />
      </View>
    </>
  )
}

/**
 * The blocks of the `review` page in the theme's order: `rating`,
 * `quick_comments` (also `review.quick_comments`), `comment` (also
 * `review.comment`).
 */
export const ReviewBlocks = ({ rating, quickComments, comment }: { rating: React.ReactNode, quickComments: React.ReactNode, comment: React.ReactNode }) => {
  const theme: any = useTheme()
  const { render } = usePageSections('review')
  const styles = useReviewStyles()
  const ratingBlock = <View style={styles.block}>{rating}</View>
  const renderRating = () => ratingBlock
  return (
    <>
      {render({
        rating: renderRating,
        quick_comments: themeVisible(theme, 'review.quick_comments') ? () => quickComments : undefined,
        comment: themeVisible(theme, 'review.comment') ? () => comment : undefined,
      }, { group: ['rating', 'quick_comments', 'comment'] })}
    </>
  )
}

/** The Continue bar (`continue` section, not hideable). */
export const ReviewContinue = ({ text, onClick, disabled }: { text: string, onClick: () => void, disabled?: boolean }) => {
  const styles = useReviewStyles()
  const theme: any = useTheme()
  // The bottom bar's main action (`bottom_bar.slots.button`).
  const action = theme.native.components.bottom_bar.slots.button
  return (
    <FloatingBottomContainer>
      <OButton text={text} size={action.size} color={action.color} appearance={action.appearance} style={styles.full} disabled={disabled} onClick={onClick} />
    </FloatingBottomContainer>
  )
}

/** The blocking loader while a review is sent (third-party overlay, painted with the theme). */
export const ReviewSpinner = ({ visible }: { visible: boolean }) => {
  const theme: any = useTheme()
  return <LoadingOverlay visible={visible} color={themeColor(theme, 'on_overlay')} overlayColor={themeColor(theme, 'overlay')} />
}
