import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { useUtils } from '@components'
import { nativeTextStyle } from '@/theme/helpers'

import {
  Body,
  Container,
  DateBlock,
  DescriptionBlock,
  IconWrapper
} from './styles'
import { Icon, OText } from '../shared';

export const WalletTransactionItem = (props: any) => {
  const {
    item,
    withFormatPrice,
    isLast
  } = props

  const theme: any = useTheme()
  const [{ parsePrice, parseDate }] = useUtils()
  const look = theme.native.components.wallet_transaction.base
  const isDebit = item?.amount < 0
  const styles = useMemo(() => StyleSheet.create({
    date: { ...nativeTextStyle(look.date), color: look.date_color },
    amount: { ...nativeTextStyle(look.amount) },
    credit: { color: look.credit_color },
    debit: { color: look.debit_color },
    description: { ...nativeTextStyle(look.description) }
  }), [look])

  return (
    <Container isLast={isLast}>
      <IconWrapper isDebit={isDebit}>
        {item?.amount > 0 && <Icon name='arrow-up' size={look.icon_size} color={look.credit_color} />}
        {isDebit && <Icon name='arrow-down' size={look.icon_size} color={look.debit_color} />}
      </IconWrapper>
      <Body>
        <DateBlock>
          <OText style={styles.date}>{parseDate(item?.created_at)}</OText>
          <OText style={[styles.amount, item?.amount > 0 ? styles.credit : styles.debit]}>
            {item?.amount > 0 && '+ '}{withFormatPrice ? parsePrice(item?.amount) : item?.amount}
          </OText>
        </DateBlock>
        {!!item?.description && (
          <DescriptionBlock>
            <OText style={styles.description}>{item?.description}</OText>
          </DescriptionBlock>
        )}
      </Body>
    </Container>
  )
}
