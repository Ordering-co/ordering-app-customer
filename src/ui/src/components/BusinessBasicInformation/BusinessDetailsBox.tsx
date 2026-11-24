import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import { useLanguage, useOrder, useUtils } from '@components'
import OText from '../shared/OText'
import { convertHoursToMinutes } from '../../utils'
import { nativeBoxStyle, themeControlHeight, themeImage, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { CardContainer, InfoSection, VerticalSeparator } from './styles'

export const BusinessDetailsBox = ({ business }: { business: any }) => {
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [orderState] = useOrder()
  const [{ parsePrice, parseDistance }] = useUtils()
  const header = themePart(theme, 'business_header', 'base')
  const styles = useMemo(() => {
    const card = themePart(theme, 'card', 'base')
    return StyleSheet.create({
      card: {
        ...nativeBoxStyle({ background: card.background, border: card.border, shadow: card.shadow }),
        borderRadius: card.radius,
        padding: card.padding
      },
      detailShrink: { flexShrink: 1, paddingHorizontal: themeSpace(theme, 'sm') },
      detailColumn: { flex: 1, alignItems: 'center', gap: themeSpace(theme, 'xs'), paddingHorizontal: themeSpace(theme, 'xs') },
      detailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: themeSpace(theme, 'xs') },
      detailImage: { width: themeControlHeight(theme, 'sm'), height: themeControlHeight(theme, 'sm') },
      detailLabel: { flexShrink: 1, textAlign: 'center' },
      columnLabel: { color: header.details_label_color },
      detailValue: { textAlign: 'center' }
    })
  }, [theme, header])

  const columns = header.details_layout === 'columns'
  const details = [
    themeVisible(theme, 'business.header.fee') && {
      key: 'fee',
      image: themeImage(theme, 'icons.business_fee'),
      value: business && parsePrice(business?.delivery_price || 0),
      label: t('DELIVERY_FEE', 'Delivery fee')
    },
    themeVisible(theme, 'business.header.time') && {
      key: 'time',
      image: themeImage(theme, 'icons.business_time'),
      value: convertHoursToMinutes(orderState?.options?.type === 1 ? business?.delivery_time : business?.pickup_time),
      label: t('DELIVERY_TIME', 'Delivery time')
    },
    themeVisible(theme, 'business.header.distance') && business?.distance != null && {
      key: 'distance',
      image: themeImage(theme, 'icons.business_distance'),
      value: parseDistance(business?.distance),
      label: t('DISTANCE', 'Distance')
    }
  ].filter(Boolean) as Array<{ key: string, image: any, value: any, label: string }>
  if (header.details_order === 'time_first') {
    details.sort((a, b) => Number(b.key === 'time') - Number(a.key === 'time'))
  }

  if (details.length === 0) return null

  return (
    <CardContainer style={styles.card}>
      {details.map((detail, index) => (
        <React.Fragment key={detail.key}>
          {index > 0 && header.details_separators && <VerticalSeparator />}
          {columns ? (
            <View testID={`business-detail-${detail.key}`} style={styles.detailColumn}>
              <View style={styles.detailHead}>
                {!!detail.image && (
                  <FastImage style={styles.detailImage} source={detail.image} objectFit='contain' />
                )}
                <OText preset='body_sm' style={[styles.detailLabel, styles.columnLabel]} numberOfLines={2}>{detail.label}</OText>
              </View>
              <OText weight={700} style={styles.detailValue} numberOfLines={1}>{detail.value}</OText>
            </View>
          ) : (
            <InfoSection style={details.length > 2 && styles.detailShrink}>
              <OText weight={700}>{detail.value}</OText>
              <OText preset='body_sm' style={details.length > 2 ? styles.detailLabel : undefined}>{detail.label}</OText>
            </InfoSection>
          )}
        </React.Fragment>
      ))}
    </CardContainer>
  )
}
