import React, { useMemo, useState } from 'react'
import { SectionTitle } from '../shared/SectionTitle'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'
import { useTheme } from 'styled-components/native'

import { HelpParams } from '../../types'
import { CmsContent } from './functions'
import { Container, HelpSubItem, LastOrdersContainer } from './styles'
import { PressableScale } from '../shared/PressableScale'
import Icon from '../shared/Icon'
import { nativeTextStyle } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'

import { useLanguage } from '@components'
import { AnimatedItem, OText, NotFoundSource, LastOrders } from '@ui'

const HelpItem = ({ item, pages, onRedirect, styles, topic }: any) => {
  const currentItem = pages.find((p: any) => p.id === item.id)
  return (
    <PressableScale onPress={() => onRedirect('HelpOptions', { item: currentItem })}>
      <HelpSubItem>
        <OText style={styles.text}>
          {item.name}
        </OText>
        <Icon name='chevron-forward' size={topic.chevron_size} color={topic.chevron_color} />
      </HelpSubItem>
    </PressableScale>
  )
}

const HelpUI = (props: HelpParams) => {
  const { cmsState, onRedirect } = props

  const { items, loading, error, pages } = cmsState

  const [, t] = useLanguage()
  const theme: any = useTheme()
  const { render } = usePageSections('help')
  // A help topic (`help_topic`) in a list row (`list_row`).
  const topic = theme.native.components.help_topic.base
  const styles = useMemo(() => StyleSheet.create({
    text: { ...nativeTextStyle(topic.text), color: topic.text_color, width: '90%' },
    column: { flexDirection: 'column' },
  }), [topic])

  const [refreshing] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const renderHelpTopics = () => (
    <>
      <SectionTitle>{t('ALL_THE_THEMES', 'All the themes')}</SectionTitle>
      {!loading && !error && items.map((item: any, idx: number) => (
        <AnimatedItem
          key={item.id}
          index={idx}
          item={<HelpItem item={item} pages={pages} onRedirect={onRedirect} styles={styles} topic={topic} />}
        />
      ))}
      {loading && (
        <Placeholder Animation={Fade}>
          <View style={styles.column}>
            {[...Array(5)].map((_, i) => (
              <HelpSubItem key={i}>
                <PlaceholderLine key={i} height={30} width={100} color={theme.native.components.skeleton.base.color} noMargin />
              </HelpSubItem>
            ))}
          </View>
        </Placeholder>
      )}
      {!loading && !!error && (
        <NotFoundSource
          simple
          content={error}
        />
      )}
    </>
  )

  const renderLastOrder = () => (
    <LastOrdersContainer>
      <SectionTitle>{t('LAST_ORDERS', 'Last Orders')}</SectionTitle>
      <LastOrders {...props} onRedirect={onRedirect} refresh={refresh} setRefresh={setRefresh} />
    </LastOrdersContainer>
  )

  return (
    <Container
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => setRefresh(true)}
        />
      }
    >
      {render({
        help_topics: renderHelpTopics,
        last_order: renderLastOrder
      })}
    </Container>
  )
}

export const Help = (props: HelpParams) => {
  const helpProps = {
    ...props,
    UIComponent: HelpUI
  }
  return (
    <CmsContent {...helpProps} />
  )
}
